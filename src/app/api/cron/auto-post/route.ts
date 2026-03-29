import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Timeout ampliado no serverless
export const maxDuration = 300; 

export async function GET(request: Request) {
    try {
        // Validação básica do Cron Job
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized Cron Trigger.' }, { status: 401 })
        }

        // Precisamos do Service Role para bypassar RLS dos usuarios
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Missing Admin Keys' }, { status: 500 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // ===== LÓGICA DE TEMPO: 07h00 da Manhã BRT (~1h antes do pico) =====
        const nowUtc = new Date();
        const nowBrt = new Date(nowUtc.getTime() + (-3 * 3600 * 1000));
        const dayOfWeek = nowBrt.getUTCDay(); // 0 Dom, 1 Seg, 2 Ter ...
        const hour = nowBrt.getUTCHours();

        console.log(`[AUTO-PILOT] Executing. Dia (BRT): ${dayOfWeek}, Hora (BRT): ${hour}`);

        // O usuário pediu "Sempre envie num horário de pico, pleo menos uma hora antes". 
        // Picos de mercado são Terça a Sexta. Vamos fixar o gatilho das automações às 07h00 da manhã.
        // Uncomment a linha abaixo em produção para travar a execução apenas nos horários de ouro.
        
        /* 
        if (dayOfWeek < 2 || dayOfWeek > 5) {
            return NextResponse.json({ skipped: true, reason: 'Off-peak days. Not running to save tokens.' })
        }
        if (hour !== 7) {
            return NextResponse.json({ skipped: true, reason: 'Not 07:00 AM BRT (prep hour).' })
        } 
        */

        const { data: automations, error } = await supabaseAdmin
            .from('user_automations')
            .select('*')
            .eq('is_active', true)

        if (error || !automations) {
            return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 })
        }

        let runCount = 0;
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const geminiModel = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

        for (const auto of automations) {
            // Check Frequency
            if (auto.last_delivered_at) {
                const last = new Date(auto.last_delivered_at);
                const diffDays = (nowUtc.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays < auto.frequency_days) {
                    console.log(`[AUTO-PILOT] Pulo: User ${auto.user_id} gerou há pouco tempo (< ${auto.frequency_days}d).`)
                    continue; 
                }
            }

            // Get Telegram Auth
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(auto.user_id)
            const chatId = userData?.user?.user_metadata?.telegram_chat_id;
            
            if (!chatId) {
                console.log(`[AUTO-PILOT] User ${auto.user_id} sem telegram. Skipping.`);
                continue;
            }

            console.log(`[AUTO-PILOT] Iniciando raspagem autônoma para User ${auto.user_id} na URL ${auto.news_source}...`);

            try {
                // PASSO 1: Ler Capa do Site usando Proxy Jina
                const capaRes = await fetch(`https://r.jina.ai/${auto.news_source}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' } })
                if (!capaRes.ok) throw new Error("Capa blockeada");
                const capaMarkdown = await capaRes.text();

                // PASSO 2: AI julga a notícia mais polemica/engajadora
                const promptSelector = `Vou te passar a Capa Markdown do site: ${auto.news_source}. Encontre a manchete de notícia MAIS relevante, inusitada ou de forte impacto (ideal para um post polêmico/debate corporativo). \nRetorne APENAS um JSON cru absoluto: {"title": "Manchete", "url": "Link absoluto"}.\n\n---MARKDOWN---\n${capaMarkdown.substring(0, 30000)}`;
                
                const selectResult = await geminiModel.generateContent(promptSelector);
                let jsonStr = selectResult.response.text().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
                const chosenNews = JSON.parse(jsonStr);

                if (!chosenNews.url || !chosenNews.url.startsWith('http')) throw new Error('Falha no JSON url');

                // PASSO 3: Ler o artigo selecionado profundamente
                const articleRes = await fetch(`https://r.jina.ai/${chosenNews.url}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' } })
                if (!articleRes.ok) throw new Error("Materia bloqueada");
                const articleMarkdown = await articleRes.text();

                // PASSO 4: Gerar a Postagem Final de LinkedIn com Base no Estilo dele
                let styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Liderança Top Voice): Liderança de pensamento e visão executiva forte com opinião.';
                if (auto.post_style === 'case_study') styleInstruction = '🎯 ESTILO (Case Resultados): Foque nos números e traga lições táticas da matéria (Hard Skills).'
                if (auto.post_style === 'contrarian') styleInstruction = '🎯 ESTILO (Debate Contrariano): Traga uma opinião polêmica sobre a notícia forçando um debate agressivo (mas educado) sobre o tema.'
                if (auto.post_style === 'storytelling') styleInstruction = '🎯 ESTILO (Storytelling Humanizado): Conte os fatos da matéria como uma história de superação de carreira.'

                const promptWriter = `Você é um Executivo Sênior Ghostwriter.\nEscreva um post nativo de LinkedIn altamente viral sobre esta Noticia: "${chosenNews.title}".\n${styleInstruction}\nRestrição Crítica: NUNCA crie introduções robóticas. ZERO hashtags no fim. Entregue um parágrafo de cada vez. Finalize fazendo uma ótima pergunta.\n\nMaterial Fonte:\n${articleMarkdown.substring(0, 20000)}`;

                const postResult = await geminiModel.generateContent(promptWriter);
                const postFinal = postResult.response.text();

                // PASSO 5: Entregar Manteiga no Telegram 1h antes do pico
                const token = process.env.TELEGRAM_BOT_TOKEN;
                const msg = `🚨 <b>Seu Post Autônomo Chegou! (Gerado da Origem Exata)</b>\n\n📌 <i>Vimos a pauta em: <a href="${chosenNews.url}">${chosenNews.title}</a></i>\n\n${postFinal.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n\n<i>Dica: O horário de pico começa em 1h. Postar agora constrói atração ideal!</i>`;
                
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
                });

                // PASSO 6: Atualizar Data de Envio no Banco
                await supabaseAdmin.from('user_automations').update({ last_delivered_at: new Date().toISOString() }).eq('id', auto.id);
                console.log(`[AUTO-PILOT] Sucesso absurdo! Post despachado para user ${auto.user_id}`);
                runCount++;

            } catch (err: any) {
                console.error(`[AUTO-PILOT] Falha no clico do user ${auto.user_id}:`, err.message);
            }
        }

        return NextResponse.json({ success: true, processed: runCount })

    } catch (e: any) {
        console.error('[CRON ERROR]', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
