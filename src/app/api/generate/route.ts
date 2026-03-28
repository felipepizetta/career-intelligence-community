import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'
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

        // 2. Parse payload
        const body = await request.json()
        const { topic, provider, postLength = 'medium' } = body

        if (!topic || topic.trim().length < 10) {
            return NextResponse.json({ error: 'Topic must be at least 10 characters.' }, { status: 400 })
        }

        if (topic.length > 10000) {
            return NextResponse.json({ error: 'Topic is too long. Maximum allowed is 10000 characters.' }, { status: 400 })
        }

        let generatedContent = ''

        // Prepare Length Instruction
        let sizeInstruction = ''
        if (postLength === 'short') {
            sizeInstruction = '✅ Posts Curtos (200-400 palavras / ~1.000 caracteres)\nUse para: Anúncios rápidos, Dicas diretas ("quick wins"), Perguntas para gerar comentários, Conteúdo mobile-first.\nVantagens: Fácil consumo em telas pequenas, Impacto direto, sem "fluff", Maior taxa de leitura completa.'
        } else if (postLength === 'long') {
            sizeInstruction = '✅ Posts Longos (1.900-2.000 palavras)\nUse para: Análises profundas de mercado, Cases detalhados com dados, Conteúdo educativo denso, Gerar backlinks e salvamentos.'
        } else {
            sizeInstruction = '✅ Posts Médios (1.300-1.600 caracteres) ⭐ RECOMENDADO\nUse para: Maioria dos conteúdos de autoridade, Storytelling profissional, Tutoriais passo a passo, Opiniões com embasamento.\nVantagens: Espaço para contexto + valor + CTA, Alinhado com dwell time ideal, 60% mais comentários que posts mais curtos/longos.'
        }

        // 3. Generate Content based on Provider
        const prompt = `# ROLE (PAPEL)
Você é um Estrategista de Conteúdo para LinkedIn, especialista em Copywriting, Growth Hacking e Construção de Autoridade. Seu objetivo é criar posts que maximizem impressões (alcance), retenção (tempo de tela) e posicionamento de autoridade.

# CONTEXT (CONTEXTO)
Eu vou fornecer um tema, ideia ou experiência. Você deve transformar isso em um post de alto desempenho seguindo as melhores práticas atuais do algoritmo do LinkedIn (2024/2025).

# INPUTS (DADOS QUE EU VOU FORNECER)
- Tema Central: ${topic}
- Público-Alvo: Profissionais e conexões no LinkedIn
- Objetivo do Post: Mostrar autoridade, gerar valor e engajar
- Tom de Voz: Profissional, autêntico e direto
- Tamanho Exigido e Formato Alvo:
${sizeInstruction}

# GUIDELINES (DIRETRIZES OBRIGATÓRIAS)
1. **O Gancho (Hook):** As primeiras 3 linhas devem parar o scroll. Use curiosidade, dados surpreendentes, confissão ou contrarianismo. Nunca comece com "Hoje quero falar sobre...".
2. **Retenção (Dwell Time):** Escreva para ser lido rapidamente. Parágrafos de 1-2 frases. Use espaço em branco. NÃO use negrito (**texto**) nem nenhuma outra formatação de Markdown, mantenha apenas texto em prosa limpo.
3. **Autoridade:** Não seja genérico. Inclua uma opinião forte, um dado concreto, um estudo de caso ou uma lição aprendida na prática. Evite clichês corporativos.
4. **Formatação:** Use emojis com moderação (apenas para estruturar, não decorar). Use listas (bullets) para facilitar a leitura.
5. **CTA (Chamada para Ação):** Termine com uma pergunta aberta que incentive comentários relevantes (o algoritmo prioriza comentários longos).
6. **Restrições:** NÃO inclua links externos no corpo do texto. NÃO use hashtags genéricas (#like #follow). Use no máximo 5 hashtags de nicho.

# PROCESS (PROCESSO DE CRIAÇÃO)
Antes de escrever o post final, siga estes passos internamente:
1. Analise o tema e identifique o ângulo mais interessante para o público.
2. Crie o Gancho (Hook) perfeito.
3. Estruture o corpo usando storytelling (Situação -> Conflito -> Resolução -> Lição).
4. Revise o texto removendo palavras desnecessárias e garantindo o ritmo.
5. Verifique se há alguma frase que pareça "texto de IA" e humanize.

# OUTPUT FORMAT (FORMATO DE SAÍDA)
IMPORTANTE: Eu não quero NENHUMA resposta estratégica, sem texto extra, sem cabeçalhos, não se apresente, apenas retorne o texto cru:
[Texto Completo do Post EM PROSA PURA, ABSOLUTAMENTE SEM MARKDOWN COMO ** ONDE PUDER]
[Hashtags relevantes no final]`;

        if (provider === 'gemini') {
            if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key' && process.env.GEMINI_API_KEY !== 'mock-key') {
                const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
                const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

                const result = await model.generateContent(prompt)
                generatedContent = result.response.text() || ''
            } else {
                // Mock response for testing setup safely without exposing errors
                generatedContent = `[MOCK GEMINI RESPONSE] Here is an engaging post about: ${topic.substring(0, 30)}...\n\n#AI #LinkedIn #Growth`
            }
        } else { // openai
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'mock-key' })
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }],
                })
                generatedContent = completion.choices[0].message.content || ''
            } else {
                generatedContent = `[MOCK OPENAI RESPONSE] Excited to share my thoughts on: ${topic.substring(0, 30)}...\n\n#OpenAI #LinkedIn #Innovation`
            }
        }

        // 4. Send to Telegram
        let telegramSent = false;
        const chatId = user.user_metadata?.telegram_chat_id
        if (chatId) {
            console.log(`[TELEGRAM] Sending message to user chat ${chatId}...`)
            const token = process.env.TELEGRAM_BOT_TOKEN
            if (token && token !== 'mock_token' && token !== 'your_bot_token_here' && token !== 'your_telegram_bot_token') {
                try {
                    // Safe string escaping for HTML mode to prevent parsing errors
                    const safeContent = generatedContent
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    
                    // Slice if over limit (Telegram max 4096 per message)
                    const MAX_LEN = 3800;
                    const truncatedContent = safeContent.length > MAX_LEN 
                        ? safeContent.substring(0, MAX_LEN) + '\n\n...[Cortado devido ao limite do Telegram]'
                        : safeContent;

                    const tgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `<b>New Career Intelligence Platform Post Generated:</b>\n\n${truncatedContent}\n\n<i>Dica: Copie o texto acima e clique no botão abaixo para ir para o LinkedIn.</i>`,
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Preparar Post no LinkedIn', url: 'https://www.linkedin.com/feed/' }]
                                ]
                            }
                        })
                    })

                    if (!tgResponse.ok) {
                        const errBody = await tgResponse.text()
                        console.error('[TELEGRAM] Error sending HTML format:', errBody)
                        
                        // Fallback completely plain text (no parse_mode)
                        const fallbackResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: `New Career Intelligence Platform Post Generated:\n\n${generatedContent.substring(0, 3800)}\n\nDica: Copie o texto acima.`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: 'Preparar Post no LinkedIn', url: 'https://www.linkedin.com/feed/' }]
                                    ]
                                }
                            })
                        })
                        if (!fallbackResponse.ok) {
                             console.error('[TELEGRAM] Fallback failed:', await fallbackResponse.text())
                        } else {
                             telegramSent = true;
                        }
                    } else {
                        telegramSent = true;
                    }
                } catch (e) {
                    console.error('[TELEGRAM HTTP POST ERROR]', e)
                }
            } else {
                 console.log('[TELEGRAM] Invalid or missing TELEGRAM_BOT_TOKEN.');
            }
        } else {
            console.log(`[TELEGRAM MOCK] User has no linked chat ID. Skipping real delivery.`)
        }

        // 5. Store in Supabase
        const { error: dbError } = await supabase.from('posts').insert({
            user_id: user.id,
            provider,
            topic,
            content: generatedContent
        })

        if (dbError) {
            console.error('[SUPABASE INSERT ERROR]', dbError)
            // We do not fail the request if it was generated and sent to TG successfuly, just warn.
        }

        return NextResponse.json({ success: true, content: generatedContent, telegramSent })

    } catch (error: any) {
        console.error('Error generating post:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
