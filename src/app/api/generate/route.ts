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
        const { topic, provider, postLength = 'medium', postStyle = 'top_voice' } = body

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

        // Prepare Style Instruction
        let styleInstruction = ''
        switch (postStyle) {
            case 'top_voice':
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Liderança Top Voice): Foque em liderança de pensamento, insights de mercado de alto nível, tendências macros e uma visão executiva madura. Demonstre segurança técnica e termine com uma opinião aguda que influencie a indústria.';
                break;
            case 'case_study':
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Case de Resultados): Adote o framework STAR (Situação -> Tarefa -> Ação -> Resultados numéricos). Foque em métricas, desafios superados e impacto de negócio. Formate parecendo um relatório de sucesso focado em atrair Recrutadores e Headhunters evidenciando "Hard Skills" e entrega quantitativa.';
                break;
            case 'technical_tutorial':
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Tutorial Técnico): Ensine algo prático na lida diária da profissão. Estruture como um guia (Passo 1, Passo 2, Ferramentas, Erros a evitar). Demonstre alta senioridade sendo mentor direto para os iniciantes e pares da sua rede.';
                break;
            case 'storytelling':
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Storytelling Humano): Narre uma trajetória de desafios extremos, erros, resiliência e adaptação. Mostre o contexto vulnerável, o conflito e a lição de carreira final ("Soft Skills"). Gere profunda empatia emocional para mostrar fit cultural irrefutável aos recrutadores.';
                break;
            case 'contrarian':
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Debate Contrariano): Comece destruindo um "conselho de LinkedIN" genérico, mito corporativo ou utopia de mercado. Apresente uma visão realista e contra o fluxo comum do seu nicho, embasada com lógica impecável. O objetivo é explodir de engajamento forçando opiniões cruzadas nos comentários.';
                break;
            default:
                styleInstruction = '🎯 ESTILO OBRIGATÓRIO: Mistura equilibrada de autoridade prática com história de vida.';
        }

        // 3. Generate Content based on Provider
        const prompt = `# ROLE (PAPEL)
Você é um Estrategista de Conteúdo para LinkedIn, especialista em Copywriting, Growth Hacking e Posicionamento de Executivos/Sêniors. Seu objetivo é ditar a escrita de modo a atrair *Headhunters* e garantir retenção máxima.

# CONTEXT (CONTEXTO DO USUÁRIO)
Vou fornecer um tema ou evento central. Sua prioridade exclusiva é transformar essa faísca em um manifesto inesquecível adotando o posicionamento que será exigido abaixo.

# INPUTS
- Tema Central: ${topic}
- Objetivo de Branding: Atração High-Ticket e Posicionamento Inabalável de Senioridade
- Tamanho e Ritmo:
${sizeInstruction}
- Posicionamento Exigido (Estilo de Escrita):
${styleInstruction}

# GUIDELINES (DIRETRIZES TÉCNICAS INEGOCIÁVEIS)
1. **O Gancho (Hook):** Primeiras 3 linhas devem chocar/segurar a atenção. NUNCA comece com "Gostaria de compartilhar", "Olha que legal", "Hoje conversei sobre". Seja direto e disruptivo no primeiro microsegundo.
2. **Readability (Espaçamento):** Frases e parágrafos ultra-curtos. Linhas em branco respirando entre cada bloco forte de informação. Zero Markdown como asteriscos ou negrito para manter a fluidez limpa nativa do LinkedIn.
3. **Imprimatur (Evite "Cara de IA"):** Evite palavras encorpadas clássicas de IA ("entusiasta", "empolgado", "na era digital", "fundamental", "crucial", "tapestry"). Escreva como um humano sênior conversando com outros humanos seniores num café expresso executivo.
4. **Formatação Otimizada:** Use poucos emojis apenas para organizar ideias como viés ou "bullets".
5. **CTA Irresistível:** A última linha é focada no algoritmo (comentários longos). Faça uma pergunta polarizadora, complexa ou baseada na experiência da audiência, fugindo de clichês (fuja de "o que você acha?").

# OUTPUT FORMAT (MANDATÓRIO)
EMITA SOMENTE E PURAMENTE O TEXTO DO POST, PRONTO PARA SER COPIADO. Nada de aspas externas, respostas prévias ou metadados de assistência. Inclua no final do texto 3 a 5 hashtags muito técnicas da área abordada soltas em uma base linear.`;

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
