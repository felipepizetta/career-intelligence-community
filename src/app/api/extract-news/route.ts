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

        // 2. Fetch parsed Markdown from the target site via Jina Reader APi
        console.log(`[EXTRACT NEWS] Analyzing Homepage via Stealth Bypass (Jina): ${url}`)
        let markdownText = ''
        try {
            const fetchRes = await fetch(`https://r.jina.ai/${url}`, {
                headers: {
                    'Accept': 'text/plain',
                    'X-Return-Format': 'markdown'
                },
                signal: AbortSignal.timeout(20000)
            })

            if (!fetchRes.ok) {
                return NextResponse.json({ error: `Falha brutal no bypass do site. Status: ${fetchRes.status}` }, { status: 500 })
            }
            markdownText = await fetchRes.text()
        } catch (err: any) {
            console.error('[EXTRACT NEWS] Fetch Error:', err)
            return NextResponse.json({ error: `Proxy bypass falhou ou deu timeout: ${err.message}` }, { status: 500 })
        }

        // Limita o Markdown pra não estourar tokens bizarramente pesados
        const truncatedMarkdown = markdownText.substring(0, 45000)

        // 3. Extract JSON with Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
            return NextResponse.json({ error: 'Gemini API keys not configured properly for scraping.' }, { status: 500 })
        }

        let baseUrlOrigin = ''
        try {
            baseUrlOrigin = new URL(url).origin
        } catch (e) { }

        const prompt = `Você atua como um Scraper Estrutural de alta precisão. Eu fornecerei o texto gerado da Capa/Homepage de um grande portal em formato MARKDOWN limpo. A URL base é: ${url}.
Sua tarefa é ler este roteiro Markdown superficialmente e encontrar de 3 a 7 manchetes de notícias valiosas da capa.

Para cada notícia encontrada, extraia o "title" (o nome da matéria limpo) e a "url" (o link embutido do Markdown no formato [Titulo](Link)).

ATENÇÃO: A URL é MANDATÓRIA e PRECISA SER UM LINK ABSOLUTO. 
Se a URL do Markdown estiver relativa (ex: /noticias/brasil), reconstrua-a prefixando estritamente com a origem: "${baseUrlOrigin}".

REGRA ESTRITA SOBRE NOMENCLATURA JSON:
Você DEVE OBRIGATORIAMENTE usar as chaves exatas em minúsculo: "title" e "url". NUNCA TRADUZA OS CAMPOS PARA PORTUGUÊS (Não use "titulo", não use "link").

Retorne **SOMENTE E ESTRITAMENTE** um JSON válido cru (array de objetos). Nenhuma introdução, nada de blocos \`\`\`json\`\`\`.
Exemplo da resposta 100% desejada:
[
  { "title": "Cientistas descobrem nova vacina", "url": "https://site.com/saude/123" }
]

Aqui está o conteúdo isolado em Markdown da homepage:
--- INICIO MARKDOWN ---
${truncatedMarkdown}
--- FIM MARKDOWN ---`;

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
