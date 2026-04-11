import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
const PDFParser = require('pdf2json');
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. GET - Buscar currículo salvo
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
            return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
        }

        return NextResponse.json({ resume: data || null });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// 2. PUT - Salvar atualizações no currículo
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content, id } = await request.json();

        if (id) {
            const { error } = await supabase.from('resumes').update({ content, updated_at: new Date() }).eq('id', id).eq('user_id', user.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('resumes').insert({ user_id: user.id, content });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// 3. POST - Fazer Upload do PDF e Extrair via IA
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const pdfFile = formData.get('pdf') as File | null;

        if (!pdfFile) {
            return NextResponse.json({ error: 'PDF é obrigatório.' }, { status: 400 });
        }

        // Ler PDF
        const arrayBuffer = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        let pdfText = '';
        try {
            pdfText = await new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1);
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(buffer);
            }) as string;
        } catch (err) {
            return NextResponse.json({ error: 'PDF inválido.' }, { status: 400 });
        }

        const cleanedResume = pdfText.replace(/\n+/g, '\n').replace(/\s+/g, ' ').substring(0, 25000).trim();

        // Gemini
        const systemKey = process.env.SYSTEM_GEMINI_API_KEY;
        if (!systemKey || systemKey === 'your_system_gemini_api_key') {
            return NextResponse.json({ error: 'SYSTEM_GEMINI_API_KEY não configurada.' }, { status: 500 });
        }

        const ai = new GoogleGenerativeAI(systemKey);
        const model = ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Você é um Recrutador Executivo e Especialista na criação de Currículos ATS-friendly.
Sua missão é extrair as informações do perfil do LinkedIn fornecido e montar um JSON de currículo altamente profissional, com tom de liderança e impacto.

FORMATO OBRIGATÓRIO (JSON EXATO):
{
  "personal": {
    "name": "Nome Completo",
    "title": "Cargo alvo baseado nas experiências principais",
    "email": "email@exemplo.com (se encontrar, senão vazio)",
    "phone": "Telefone (se encontrar)",
    "location": "Cidade, Estado",
    "linkedin": "URL (se encontrar)",
    "portfolio": "URL (se encontrar)",
    "customLinks": [
      {
        "label": "Nome da Rede (ex: Github, Medium, Behance)",
        "url": "URL correspondente"
      }
    ]
  },
  "summary": "Resumo de 3 a 4 linhas. Foco em hard skills, anos de experiência, resultados quantificáveis e liderança. O tom deve ser sênior e direto.",
  "experience": [
    {
      "company": "Nome da Empresa",
      "position": "Cargo",
      "period": "Ex: Jan 2020 - Atual",
      "description": [
        "Verbo de ação forte (Liderou, Otimizou, Atingiu) focado emresultado quantificável.",
        "Segunda responsabilidade de impacto",
        "Terceira entrega técnica"
      ]
    }
  ],
  "education": [
    {
      "institution": "Universidade",
      "degree": "Grau e Curso",
      "period": "Ex: 2012 - 2016"
    }
  ],
  "projects": [
    {
      "name": "Nome do Projeto",
      "description": "Descrição sucinta de 1 ou 2 linhas focando em tecnologias usadas e problema resolvido (Ex: Desenvolvido em React).",
      "url": "URL Github ou Site (se encontrar)"
    }
  ],
  "certifications": [
    {
      "name": "Nome Completo da Certificação",
      "issuer": "Emissor (ex: AWS, Google, Alura, Microsoft)",
      "year": "Ano de Emissão (ex: 2023)",
      "credentialId": "ID/Código da Credencial (se existir)",
      "url": "URL/Link da Credencial (se existir)"
    }
  ],
  "languages": [
    {
      "name": "Nome do Idioma (Ex: Inglês)",
      "level": "Nível de Proficiência (Ex: Avançado / Fluente)"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8"]
}

TEXTO BRUTO DO PDF LINKEDIN PARA EXTRAÇÃO:
${cleanedResume}`;

        const result = await model.generateContent(prompt);
        let content = result.response.text();
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const generatedResume = JSON.parse(content);

        // Salvar no Banco
        const { data, error: dbError } = await supabase.from('resumes').insert({
            user_id: user.id,
            content: generatedResume
        }).select().single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, resume: data });

    } catch (error: any) {
        console.error('[RESUME BUILDER] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
