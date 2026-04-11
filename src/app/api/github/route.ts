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

        const { url } = await request.json();

        if (!url || !url.includes('github.com')) {
            return NextResponse.json({ error: 'URL do GitHub inválida.' }, { status: 400 });
        }

        // Extract Owner and Repo
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            return NextResponse.json({ error: 'Formato de repositório desconhecido.' }, { status: 400 });
        }
        
        const owner = match[1];
        const repo = match[2].replace('.git', '');

        // Fetch Readme text using standard Github RAW acceptance
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { 'Accept': 'application/vnd.github.v3.raw' }
        });

        if (!readmeRes.ok) {
            return NextResponse.json({ error: 'Repositório não encontrado, privado ou não contém Readme.' }, { status: 404 });
        }

        const readmeText = await readmeRes.text();
        const cleanedReadme = readmeText.replace(/\n+/g, '\n').substring(0, 15000);

        // Gemini Generative process
        const systemKey = process.env.SYSTEM_GEMINI_API_KEY;
        if (!systemKey || systemKey === 'your_system_gemini_api_key') {
            return NextResponse.json({ error: 'SYSTEM_GEMINI_API_KEY não configurada.' }, { status: 500 });
        }

        const ai = new GoogleGenerativeAI(systemKey);
        const model = ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Você é um Recrutador Técnico Senior especializado em currículos Dev.
Leia o README do projeto GitHub abaixo e crie uma descrição curta (1 a 2 linhas completas) de ALTO IMPACTO focando no que foi construído (aplicativo, sistema, api) e nas KEYWORDS de Hard Skills Técnicas principais utilizadas. O tom deve ser estritamente corporativo, direto e executivo para colocar no portfólio do currículo.

Nome do Repositório bruto: ${repo}
Deduza um nome polido e comercial para a chave "name" do resultado.

FORMATO OBRIGATÓRIO (JSON EXATO):
{
  "name": "Nome Polido do Projeto (Ex: API de Gestão SaaS)",
  "description": "Sistema desenvolvido usando [Tech1], [Tech2] e [Tech3] com foco em [Resultado/Performance]."
}

README DO GITHUB:
${cleanedReadme}`;

        const result = await model.generateContent(prompt);
        let content = result.response.text();
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const generatedProject = JSON.parse(content);

        return NextResponse.json({ success: true, project: generatedProject });

    } catch (error: any) {
        console.error('[GITHUB SCRAPER] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
