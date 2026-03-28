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
            return NextResponse.json({ error: 'URL do artigo inválida.' }, { status: 400 })
        }

        // 2. Fetch raw HTML from the target deep article
        console.log(`[EXTRACT ARTICLE] Sugando matéria densa: ${url}`)
        let htmlText = ''
        try {
            const fetchRes = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1920 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                signal: AbortSignal.timeout(12000)
            })

            if (!fetchRes.ok) {
                return NextResponse.json({ error: `Falha ao abrir a matéria. Status do site alvo: ${fetchRes.status}` }, { status: 500 })
            }
            htmlText = await fetchRes.text()
        } catch (err: any) {
            console.error('[EXTRACT ARTICLE] Fetch Deep Error:', err)
            return NextResponse.json({ error: `Servidor do artigo inacessível: ${err.message}` }, { status: 500 })
        }

        // Limpeza drástica: removemos o <head>, <script>, <style> e <svg> para espremer só o texto do body
        const cleanHtml = htmlText
            .replace(/<head[\s\S]*?<\/head>/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');

        // Focando mais profundo.
        const truncatedHtml = cleanHtml.substring(0, 90000)

        // 3. Extract Deep Content with Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
            return NextResponse.json({ error: 'Gemini API keys não configuradas.' }, { status: 500 })
        }

        const prompt = `Você atua como um Leitor de Matérias/Artigos Ultra Preciso (Deep Scraper). Eu fornecerei o HTML bruto de uma página que o usuário escolheu para ler.
Sua missão é IGNORAR violentamente os menus do cabeçalho, os links de rodapé, banners de anúncios de empresas parceras e seções laterais de "Outras notícias", e MANTENHA O FOCO EXCLUSIVO em extrair O TEXTO EM PROSA DENSO DENTRO DO CORPO DA NOTÍCIA SELECIONADA.

Aja com extrema competência: traga todos os fatos da matéria informacional. Extraia a NOTÍCIA POR COMPLETO, não resuma e não corte parágrafos, traga todo o conteúdo de texto relevante da matéria.

# IMPORTANTE
- NÃO DE NENHUMA INSTRUÇÃO DO QUE DEVE SER FEITO. VOCÊ JÁ SABE O QUE FAZER.
- NÃO CRIE NENHUMA FRASE INTRODUTÓRIA como "Aqui está o texto" ou "O artigo fala aborda".
- RETORNE SOMENTE A NOTÍCIA POR COMPLETO, O PURO TEXTO PARA FORMAR A MASSA DURA DE CONHECIMENTO, em parágrafos separados. LIMPE O TEXTO DE CARACTERES ESTRANHOS (TABS, LIXOS DE HTML, etc). A ÚNICA COISA NA SUA RESPOSTA DEVE SER O TEXTO DA MATÉRIA.

Aqui está o código-fonte estrangulado da página acessada:
--- INICIO HTML ---
\${truncatedHtml}
--- FIM HTML ---`;

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

        console.log(`[EXTRACT ARTICLE] Devorando Article Content with Gemini...`)
        const result = await model.generateContent(prompt)
        const pureText = result.response.text() || ''

        return NextResponse.json({ success: true, content: pureText })

    } catch (error: any) {
        console.error('Error on extract-article route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
