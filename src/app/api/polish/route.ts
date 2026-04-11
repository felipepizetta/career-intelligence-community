import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { text, type } = await request.json();

        if (!text || text.length < 5) {
            return NextResponse.json({ error: 'Texto muito curto para reescrever.' }, { status: 400 });
        }

        const systemKey = process.env.SYSTEM_GEMINI_API_KEY;
        if (!systemKey || systemKey === 'your_system_gemini_api_key') {
            return NextResponse.json({ error: 'API_KEY não configurada.' }, { status: 500 });
        }

        const ai = new GoogleGenerativeAI(systemKey);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt = '';
        if (type === 'summary') {
            prompt = `Você atua como Headhunter Senior de altíssimo padrão executivo (Vale do Silício).
Tome este resumo profissional cru e o reescreva.
Regras:
1. Deve ser em Português do Brasil claro.
2. NUNCA use primeira pessoa (Eu construí, eu fiz). Use formulações orientadas para ação (Forte histórico em, Especialista que liderou).
3. Seja breve, cortando "gorduras" e evidenciando hard skills e resultados. Max. de 4 linhas longas. Mantenha os sentidos intactos, apenas melhore a gramática e tom de negócio.

Texto Cru do Candidato:
"${text}"

Me devolva ESTREITAMENTE o texto reescrito polido. Sem aspas ou formatações markdown extras. Apenas o parágrafo.`;
        } else if (type === 'skills') {
            prompt = `Você atua como Headhunter Senior de altíssimo padrão executivo técnico.
Tome esta lista bagunçada de competências/skills de um candidato e devolva uma lista limpa, modernizada e focada em palavras-chave fortes para ATS.
Regras:
1. Agrupe ou remova redundâncias sutis.
2. Formate EXATAMENTE as skills separadas apenas por ponto e vírgula (;). Em Português.
3. Não use retornos de linha ou bullets. Apenas o texto direto. Exemplo: "Gestão de Projetos; Transformação Digital; Node.js;"

Skills cruas:
"${text}"`;
        } else {
            prompt = `Você atua como Headhunter Senior de altíssimo padrão executivo.
Tome estes tópicos de descrição de uma experiência de trabalho e os reescreva garantindo alta pontuação no ATS da empresa contratante.
Regras:
1. Retorne cada frase iniciando com um Verbo de Ação super executivo (Liderou, Implementou, Otimizou, Executou, Desenvolveu, Orquestrou, Aumentou).
2. Não use "eu" nem nada na primeira pessoa.
3. Conserve o exato número de tópicos recebidos, apenas melhore o português de cada um e o impacto corporativo das palavras. Em português do Brasil.
4. Você me devolverá uma string com os tópicos separados apenas pela quebra de linha normal. Sem asteriscos Markdown.

Tópicos crus:
"${text}"`;
        }

        const result = await model.generateContent(prompt);
        let content = result.response.text();
        
        // Remove markdown artifacts se o gemini teimar
        content = content.replace(/\*/g, '').trim();

        return NextResponse.json({ success: true, polishedText: content });

    } catch (error: any) {
        console.error('[POLISH API] Error:', error);
        return NextResponse.json({ error: 'Erro ao conectar à IA de polimento.' }, { status: 500 });
    }
}
