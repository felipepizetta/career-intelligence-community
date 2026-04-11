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

        const { action, resumeData, jobDescription } = await request.json();

        if (!jobDescription || jobDescription.length < 20) {
            return NextResponse.json({ error: 'Job description muito curta.' }, { status: 400 });
        }

        const systemKey = process.env.SYSTEM_GEMINI_API_KEY;
        if (!systemKey || systemKey === 'your_system_gemini_api_key') {
            return NextResponse.json({ error: 'API_KEY não configurada.' }, { status: 500 });
        }

        const ai = new GoogleGenerativeAI(systemKey);

        if (action === 'analyze') {
            const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
            const prompt = `Você é um Recrutador Senior (Headhunter) do Vale do Silício. Analise rigorosamente se o currículo atual atende aos requisitos desta vaga (Job Description).
            
            Retorne UM NOVO JSON com exatamente essa estrutura:
            {
               "score": <numero interio de 0 a 100 indicando a aderência/fit>,
               "feedback": [ <array com 3 strings de conselhos curtos que o candidato precisa melhorar> ]
            }

            Vaga (JD):
            ${jobDescription}

            Currículo do Candidato (JSON bruto):
            ${JSON.stringify(resumeData)}
            `;
            const result = await model.generateContent(prompt);
            return NextResponse.json(JSON.parse(result.response.text()));
        }

        if (action === 'tailor') {
            const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
            const prompt = `Você é um Otimizador Especialista de Currículos para sistemas ATS de classe global. 
            Você receberá um currículo em formato JSON e uma descrição de vaga (Job Description).
            Sua tarefa é modificar ESTRITAMENTE campos de texto livre do currículo JSON para dar mais "match" com a vaga.
            
            Regras de modificação:
            1. 'summary': Reescreva com impacto executivo, destacando qualidades pedidas na vaga.
            2. 'skills': Reordene a lista, traga para o começo as skills que dão match.
            3. 'experience[].description': Reescreva os bullet points focando nas palavras-chave e verbos importantes da vaga. Mantenha Datas e Cargos INTACTOS.
            
            Restrições:
            - NÃO invente cargos, locais de trabalho, ou períodos que o candidato nunca esteve.
            - Mantenha exatamente a mesma estrutura JSON original. Apenas atualize os textos.
            - Responda OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL.
            
            Vaga (JD):
            ${jobDescription}

            Currículo Original:
            ${JSON.stringify(resumeData)}
            `;
            const result = await model.generateContent(prompt);
            return NextResponse.json({ tailoredResume: JSON.parse(result.response.text()) });
        }

        if (action === 'cover_letter') {
            const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Atuando como o candidato (baseado no currículo JSON fornecido), redija uma Cover Letter (Carta de Apresentação) executiva, altamente persuasiva, visando a seguinte vaga.
            
            Regras:
            1. Em Português do Brasil.
            2. Use tom formal, confiante e vá direto aos resultados que podem ajudar a empresa.
            3. Sem cabeçalhos de cartas dos anos 90 (como "Prezado Diretor de RH" ou dados de endereço). Comece com um impacto ou saudação moderna "Olá equipe de contratação,".
            4. Retorne APENAS o texto da carta formatado em parágrafos.
            
            Vaga:
            ${jobDescription}

            Currículo Base:
            ${JSON.stringify(resumeData)}
            `;
            const result = await model.generateContent(prompt);
            return NextResponse.json({ coverLetter: result.response.text().trim() });
        }

        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

    } catch (error: any) {
        console.error('[TAILOR API] Error:', error);
        return NextResponse.json({ error: 'Erro ao conectar à IA de Tailoring.' }, { status: 500 });
    }
}
