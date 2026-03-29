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

        // 2. Fetch parsed Markdown from the target deep article via Stealth Reader
        console.log(`[EXTRACT ARTICLE] Sugando matéria densa via Deep Scraper: ${url}`)
        let markdownText = ''
        try {
            const fetchRes = await fetch(`https://r.jina.ai/${url}`, {
                headers: {
                    'Accept': 'text/plain',
                    'X-Return-Format': 'markdown'
                },
                signal: AbortSignal.timeout(20000) // Mais timeout pois o proxy headless tem overhead
            })

            if (!fetchRes.ok) {
                return NextResponse.json({ error: `O bloqueio do site impediu a leitura completa. Status: ${fetchRes.status}` }, { status: 500 })
            }
            markdownText = await fetchRes.text()
        } catch (err: any) {
            console.error('[EXTRACT ARTICLE] Fetch Jina Deep Error:', err)
            return NextResponse.json({ error: `Servidor do artigo inacessível ou timeout estourado: ${err.message}` }, { status: 500 })
        }

        // Limita o tamanho do texto Markdown recebido para não estaleirar os tokens absurdamente.
        // O Markdown é incrivelmente denso e limpo comparado a HTML.
        const truncatedMarkdown = markdownText.substring(0, 45000)

        // 3. Extract Deep Content with Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
            return NextResponse.json({ error: 'Gemini API keys não configuradas.' }, { status: 500 })
        }

        const prompt = `Você atua como um Leitor de Matérias/Artigos Ultra Preciso (Purificador). Eu fornecerei o texto extraído cru de uma matéria jornalística em formato Markdown.
Sua missão EXCLUSIVA e INFLEXÍVEL é isolar e retornar a "Notícia Completa" sem NENHUM texto inútil.

Muitas vezes o gerador de Markdown deixa passar "lixos corporativos" como: "Newsletter", "Leia Também:", legendas de fotos perdidas "Foto: Fulano/Getty", links de propaganda ou avisos sobre Cookies e Paywalls.

DESTRUA violentamente todos os lixos textuais periféricos E MANTENHA O FOCO EXCLUSIVO NO CORPO DA NOTÍCIA SELECIONADA.
Extraia a NOTÍCIA POR COMPLETO, não resuma e não corte parágrafos úteis de informação, traga todo o conteúdo de texto focado da matéria perfeitamente.

# IMPORTANTE
- NÃO DE NENHUMA INSTRUÇÃO OU NOTA MARGINAL.
- NÃO CRIE NENHUMA FRASE INTRODUTÓRIA como "Aqui está a notícia." ou "O texto foi limpo".
- RETORNE SOMENTE A MATÉRIA PURA, O PURO TEXTO PARA FORMAR A MASSA DURA DE CONHECIMENTO, em parágrafos limpos. A ÚNICA COISA NA SUA RESPOSTA DEVE SER A JORNADA TEXTUAL DA MATÉRIA EM PROSA.

Aqui está o conteúdo extraído da página acessada:
--- INICIO DA MATERIA EXTRAIDA ---
${truncatedMarkdown}
--- FIM DA MATERIA EXTRAIDA ---`;

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
