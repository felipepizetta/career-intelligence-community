import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify Authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { url } = body

        if (!url || !url.startsWith('http')) {
            return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 })
        }

        // 2. Fetch raw HTML from the target site
        console.log(`[EXTRACT NEWS] Fetching URL: ${url}`)
        let htmlText = ''
        try {
            const fetchRes = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                // timeout de 10s pra nao travar Vercel
                signal: AbortSignal.timeout(10000)
            })

            if (!fetchRes.ok) {
                return NextResponse.json({ error: `Failed to fetch website. Status: ${fetchRes.status}` }, { status: 500 })
            }
            htmlText = await fetchRes.text()
        } catch (err: any) {
            console.error('[EXTRACT NEWS] Fetch Error:', err)
            return NextResponse.json({ error: `Could not reach the provided URL: ${err.message}` }, { status: 500 })
        }

        // Limpeza drástica: removemos o <head>, <script>, <style> e <svg> para economizar tokens gigantes e focar no <body> puro
        const cleanHtml = htmlText
            .replace(/<head[\s\S]*?<\/head>/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');

        // Limita o HTML pra não estourar tokens bizarramente pesados
        const truncatedHtml = cleanHtml.substring(0, 80000)

        // 3. Extract JSON with Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
            return NextResponse.json({ error: 'Gemini API keys not configured properly for scraping.' }, { status: 500 })
        }

        let baseUrlOrigin = ''
        try {
            baseUrlOrigin = new URL(url).origin
        } catch (e) { }

        const prompt = `Você atua como um Web Scraper de alta precisão. Eu fornecerei o HTML bruto de uma página da web (Capa ou Feed). A URL base acessada é: ${url}.
Sua tarefa é encontrar de 3 a 7 manchetes principais da página.
Para cada notícia encontrada, extraia o "title" (o título do artigo em string clara) e DEVE OBRIGATORIAMENTE extrair a "url" (o link em "href" absoluto).

ATENÇÃO: É de vital importância que a "url" seja um link ABSOLUTO E VÁLIDO. 
Se a tag "href" contiver um caminho relativo, recrie a linha misturando e prefixando forçadamente com a origem "${baseUrlOrigin}".

REGRA ESTRITA SOBRE NOMENCLATURA JSON:
Você DEVE OBRIGATORIAMENTE usar as chaves exatas com nomes em minúsculo chamadas "title" e "url". NUNCA traduza os nomes destas chaves Javascript para "titulo" ou "manchete", pois a minha interface frontend quebra. Apenas o valor das string das manchetes será em português ou o idioma original da notícia.

Retorne **SOMENTE E ESTRITAMENTE** um JSON válido e cru que represente um array de objetos. Zero introduções ou markdowns. Zero escapes que não sejam necessários.
Formato exato esperado:
[
  { "title": "Nome da Notícia Clara Evitando Lixo e Caracteres Especiais HTML", "url": "https://..." }
]

Aqui está o HTML restrito da homepage:
--- INICIO HTML ---
${truncatedHtml}
--- FIM HTML ---`;

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

        console.log(`[EXTRACT NEWS] Analyzing HTML with Gemini...`)
        const result = await model.generateContent(prompt)
        let rawResponse = result.response.text()

        // Clean potentially messy markdown json wraps
        rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()

        let parsedNews = []
        try {
            let rawArray = JSON.parse(rawResponse)

            // Garantia bizarra: se o Gemini enviou um Objeto em vez de Array, tentamos salvar puxando as chaves internas
            if (!Array.isArray(rawArray)) {
                if (rawArray.articles && Array.isArray(rawArray.articles)) rawArray = rawArray.articles;
                else if (rawArray.news && Array.isArray(rawArray.news)) rawArray = rawArray.news;
                else if (rawArray.manchetes && Array.isArray(rawArray.manchetes)) rawArray = rawArray.manchetes;
                else rawArray = [rawArray]; // Transforma em array de um item
            }

            // Força a padronização das chaves no backend ignorando desvios e alucinações na tipagem do Gemini
            parsedNews = rawArray.map((item: any) => {
                if (typeof item !== 'object' || item === null) return null;

                const keys = Object.keys(item)
                let title = ''
                let url = ''

                keys.forEach(key => {
                    const lKey = key.toLowerCase()
                    if (lKey.includes('tit') || lKey.includes('name') || lKey.includes('head') || lKey.includes('manchete') || lKey.includes('desc') || lKey.includes('texto')) {
                        title = item[key]
                    }
                    if (lKey.includes('url') || lKey.includes('link') || lKey.includes('href') || lKey.includes('src') || lKey.includes('site')) {
                        url = item[key]
                    }
                })

                if (!title) {
                    for (const key of keys) {
                        const val = item[key];
                        if (typeof val === 'string' && val.length > 5 && !val.startsWith('http')) {
                            title = val;
                            break;
                        }
                    }
                }

                if (!url) {
                    for (const key of keys) {
                        const val = item[key];
                        if (typeof val === 'string' && val.startsWith('http')) {
                            url = val;
                            break;
                        }
                    }
                }

                const finalTitle = typeof title === 'string' ? title.trim() : String(title || '');
                const finalUrl = typeof url === 'string' ? url.trim() : String(url || '');

                console.log(`[EXTRACT NEWS DEBUG] Extracted row -> Title: ${finalTitle?.substring(0, 20)}... | URL: ${finalUrl}`)
                return { title: finalTitle, url: finalUrl }
            }).filter((n: any) => n && n.title && n.title.length > 3)

            console.log(`[EXTRACT NEWS] Parsed ${parsedNews.length} articles successfully! First:`, parsedNews[0]?.title)
        } catch (e: any) {
            console.error('[EXTRACT NEWS] Falha Total de Parse ou Mapping:', e.message)
            console.error('[EXTRACT NEWS] String Bruta recebida da IA que causou a falha:', rawResponse)
            return NextResponse.json({ error: 'AI Extractor falhou ao processar a resposta do Gemini. Tente de novo.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, articles: parsedNews })

    } catch (error: any) {
        console.error('Error on extract-news route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
