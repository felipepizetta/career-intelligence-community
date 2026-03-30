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

        for (const auto of automations) {
            // 1. Filtro por Dias Permitidos (Calendário)
            const allowedDaysStr = auto.schedule_days || '1,2,3,4,5';
            const allowedDays = allowedDaysStr.split(',').map(Number);
            if (!allowedDays.includes(dayOfWeek)) {
                console.log(`[AUTO-PILOT] Pulo: User ${auto.user_id} não tem automação ativa para hoje (Dia ${dayOfWeek}).`);
                continue;
            }

            // 2. Filtro de Horários de Pico (1h antes do Pico Máximo)
            const allowedPostsPerDay = auto.posts_per_day || 1;
            let allowedHours: number[] = []; // Horários em BRT
            
            if (allowedPostsPerDay === 1) {
                allowedHours = [7]; // 07:00 (1h antes do pico da manhã 08:00)
            } else if (allowedPostsPerDay === 2) {
                allowedHours = [7, 11]; // 07:00 e 11:00 (1h antes do almoço 12:00)
            } else if (allowedPostsPerDay === 3) {
                allowedHours = [7, 11, 16]; // 07:00, 11:00 e 16:00 (1h antes do fim de tarde 17:00)
            } else {
                allowedHours = [7, 11, 14, 16]; // Extra
            }

            if (!allowedHours.includes(hour)) {
                console.log(`[AUTO-PILOT] Pulo: Hora atual (${hour}h BRT) não é um horário alvo para estratégia de ${allowedPostsPerDay} posts do user ${auto.user_id}.`);
                continue;
            }

            // 3. Prevenção de Duplicidade no mesmo Slot de Horário (Flood Block)
            if (auto.last_delivered_at) {
                const last = new Date(auto.last_delivered_at);
                const diffHours = (nowUtc.getTime() - last.getTime()) / (1000 * 60 * 60);
                
                // Se rodou há menos de 2 horas atrás, significa que já cobriu ESSE pico alvo.
                if (diffHours < 2) { 
                    console.log(`[AUTO-PILOT] Pulo: User ${auto.user_id} já recebeu para este horário de pico recentemente (<2h).`)
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

            // Get User API Key or fallback to env
            const userKey = userData?.user?.user_metadata?.gemini_api_key;
            const envKey = process.env.GEMINI_API_KEY;
            const finalKey = (userKey && userKey.length > 5) ? userKey : (envKey || '');

            if (!finalKey) {
                console.log(`[AUTO-PILOT] Missing Gemini Key for user ${auto.user_id}. Skipping.`);
                continue;
            }

            const ai = new GoogleGenerativeAI(finalKey);
            const geminiModel = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // Split incoming multiline string to array of URLs
            const urlList = auto.news_source.split('\n').map((u: string) => u.trim()).filter((u: string) => u.startsWith('http'));
            
            if (urlList.length === 0) {
                console.log(`[AUTO-PILOT] No valid URLs found for user ${auto.user_id}. Skipping.`);
                continue;
            }

            // Memory Tracker: Check if it's the same day to retain used sources
            const isSameDay = auto.last_delivered_at && new Date(auto.last_delivered_at).getUTCDate() === nowUtc.getUTCDate() && new Date(auto.last_delivered_at).getUTCMonth() === nowUtc.getUTCMonth() && new Date(auto.last_delivered_at).getUTCFullYear() === nowUtc.getUTCFullYear();
            let usedSources = isSameDay && auto.used_sources_today ? auto.used_sources_today.split(',') : [];

            // Filter out used URLs
            let availableUrlList = urlList.filter((u: string) => !usedSources.includes(u));
            
            // Fallback: Se ele já esgotou os links diários, zera a memória e repete para não perder o Post estipulado.
            if (availableUrlList.length === 0) {
                console.log(`[AUTO-PILOT] User ${auto.user_id} esgotou os sites diários. Fazendo reset da memória de urls.`);
                availableUrlList = urlList;
                usedSources = [];
            }

            console.log(`[AUTO-PILOT] User ${auto.user_id} - Verificando ${availableUrlList.length} sites (de ${urlList.length}) disponíveis simultaneamente...`);

            try {
                // PASSO 1: Baixar as capas de todos os sites em paralelo para avaliação da IA
                const coversPromises = availableUrlList.map(async (u: string) => {
                    try {
                        const res = await fetch(`https://r.jina.ai/${u}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' } });
                        if (!res.ok) return null;
                        const text = await res.text();
                        // 15k chars por site é o suficiente para pegar os links das capas
                        return `### FONTE_URL: ${u}\n${text.substring(0, 15000)}\n\n---\n\n`;
                    } catch {
                        return null;
                    }
                });

                const coversResults = await Promise.allSettled(coversPromises);
                let combinedMarkdown = '';
                coversResults.forEach((r: any) => {
                    if (r.status === 'fulfilled' && r.value) combinedMarkdown += r.value;
                });

                if (!combinedMarkdown.trim()) throw new Error("Capa de todos os sites bloquearam acesso");

                // PASSO 2: O AI "Editor-Chefe" julga E escolhe o estilo (se estiver no Automático)
                const isAutoStyle = auto.post_style === 'auto';
                const jsonFormat = isAutoStyle 
                    ? '{"title": "Manchete", "url": "Link absoluto da matéria", "source_url": "FONTE_URL exata que você analisou", "archetype": "top_voice" | "case_study" | "contrarian" | "storytelling"}'
                    : '{"title": "Manchete", "url": "Link absoluto da matéria", "source_url": "FONTE_URL exata que você analisou"}';

                const promptSelector = `Vou te passar o formato Markdown das Capas de VÁRIOS sites de notícias simultaneamente.\nComo um Editor-Chefe brilhante, você deve analisar TODAS as opções disponíveis nestas páginas e selecionar a ÚNICA notícia que julgar ser a mais genial, impactante e engajadora para a rede social LinkedIn corporativa no dia de hoje.\n${isAutoStyle ? "Além de escolher a pauta, defina logicamente, baseado no assunto, qual o MELHOR arquétipo de texto se encaixa nessa postagem." : ""}\n\nRetorne APENAS um JSON cru absoluto neste formato exato e coloque a FONTE_URL da qual retirou a matéria no campo source_url:\n${jsonFormat}\n\n---MARKDOWN AGREGADO---\n${combinedMarkdown.substring(0, 150000)}`;
                
                const selectResult = await geminiModel.generateContent(promptSelector);
                let jsonStr = selectResult.response.text().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
                const chosenNews = JSON.parse(jsonStr);

                if (!chosenNews.url || !chosenNews.url.startsWith('http')) throw new Error('Falha na extração de URL do JSON pelo Editor-Chefe');
                
                const chosenSource = chosenNews.source_url || availableUrlList[0]; // fallback
                usedSources.push(chosenSource);

                console.log(`[AUTO-PILOT] IA escolheu pauta: ${chosenNews.title} (da fonte ${chosenSource}). O estilo associado foi: ${chosenNews.archetype || auto.post_style}`);

                // PASSO 3: Ler o artigo selecionado profundamente
                const articleRes = await fetch(`https://r.jina.ai/${chosenNews.url}`, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' } })
                if (!articleRes.ok) throw new Error("A matéria principal estava bloqueada");
                const articleMarkdown = await articleRes.text();

                // PASSO 4: Gerar a Postagem Final de LinkedIn com O Estilo Assinalado
                const activeStyle = isAutoStyle ? (chosenNews.archetype || 'top_voice') : auto.post_style;
                let styleInstruction = '🎯 ESTILO OBRIGATÓRIO (Liderança Top Voice): Liderança de pensamento e visão executiva forte com opinião.';
                
                if (activeStyle === 'case_study') styleInstruction = '🎯 ESTILO (Case Resultados): Foque nos números e traga lições táticas da matéria (Hard Skills).'
                if (activeStyle === 'contrarian') styleInstruction = '🎯 ESTILO (Debate Contrariano): Traga uma opinião polêmica sobre a notícia forçando um debate agressivo (mas educado) sobre o tema.'
                if (activeStyle === 'storytelling') styleInstruction = '🎯 ESTILO (Storytelling Humanizado): Conte os fatos da matéria como uma história de superação de carreira.'

                const promptWriter = `Você é um Executivo Sênior Ghostwriter.\nEscreva um post nativo de LinkedIn altamente viral sobre esta Noticia: "${chosenNews.title}".\n${styleInstruction}\nRestrição Crítica: NUNCA crie introduções robóticas. ZERO hashtags no fim. Entregue um parágrafo de cada vez. Finalize fazendo uma ótima reflexão ou pergunta.\n\nMaterial Fonte:\n${articleMarkdown.substring(0, 20000)}`;

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

                // PASSO 6: Atualizar Data de Envio no Banco e Retenção de URL
                await supabaseAdmin.from('user_automations').update({ 
                    last_delivered_at: new Date().toISOString(),
                    used_sources_today: usedSources.join(',') 
                }).eq('id', auto.id);
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
