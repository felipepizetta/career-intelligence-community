import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
const PDFParser = require('pdf2json');

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse FormData
        const formData = await request.formData();
        const goal = formData.get('goal') as string;
        const targetRole = formData.get('targetRole') as string;
        const pdfFile = formData.get('pdf') as File | null;

        if (!goal || !targetRole || !pdfFile) {
            return NextResponse.json({ error: 'Todos os campos e o PDF são obrigatórios.' }, { status: 400 });
        }

        // 3. Extract Text from PDF
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
            console.error("Erro ao analisar o PDF:", err);
            return NextResponse.json({ error: 'Não foi possível ler o arquivo PDF. Certifique-se de que é um PDF válido exportado do LinkedIn.' }, { status: 400 });
        }

        // 4. Limpar e Otimizar o Texto do PDF (Remover quebras de linha excessivas para não gastar tokens atoa)
        const cleanedResume = pdfText
            .replace(/\n+/g, '\n') // Múltiplas quebras viram uma só
            .replace(/\s+/g, ' ')  // Espaços duplos removidos
            .substring(0, 15000)   // Hard limit pra não estourar o contexto das IAs
            .trim();

        // 5. Compilar o novo mega-contexto (Limitado para não explodir o JWT Cookie / HTTP 431)
        const compiledContext = `
[OBJETIVO ATUAL DO USUÁRIO]: ${goal}
[CARGO ALVO PARA OS PRÓXIMOS ANOS]: ${targetRole}

[CURRÍCULO E EXPERIÊNCIA PRÉVIA DO LINKEDIN]:
${cleanedResume.substring(0, 1500)}
        `.trim();

        // 6. Chamar Gemini para Gerar os Insights do Dashboard (Skills + Plan)
        // Utilizamos uma chave exclusiva do sistema (SYSTEM_GEMINI_API_KEY) para ações internas como extração de perfil
        const finalKey = process.env.SYSTEM_GEMINI_API_KEY;
        
        // Dados de fallback caso dê erro de IA ou usuário não possua a chave
        let analyticsJSON: any = {
            current_status: "Aguardando análise real do seu perfil. Insira sua API Key para a inteligência decodificar exatamente onde você está hoje.",
            top_skills: ["Capacidade Adaptativa", "Resolução de Problemas", "Gestão de Tempo", "Foco Operacional"],
            action_plan: [
                "Insira sua chave de API do Gemini (Google) nas Configurações para obter insights reais.",
                "Após inserir a chave, seus uploads de currículo refletirão métricas reias aqui.",
                "Por enquanto, você pode gerar posts genéricos através do 'Criador de Posts'."
            ]
        };

        if (finalKey && finalKey !== 'your_system_gemini_api_key' && finalKey !== 'mock-key') {
            try {
                console.log("[ONBOARDING] Initiating Gemini extraction for insights...");
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const ai = new GoogleGenerativeAI(finalKey);
                const model = ai.getGenerativeModel({ 
                    model: 'gemini-2.5-flash',
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `Você é um Analista de Carreira e Headhunter de elite. 
Sua missão é responder EXATAMENTE e APENAS com um objeto JSON.
Formato estrito:
{
  "current_status": "Breve resumo (1 a 2 frases) de onde o profissional está no mercado hoje. Avalie o nível de senioridade real dele baseado no currículo, momento atual de carreira e o que ele já domina.",
  "top_skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "action_plan": [
     "Primeira ação tática e específica, partindo EXATAMENTE do momento atual dele (current_status) em direção ao Cargo Alvo (Ex: Assumir projeto de X ou Estudar Y).",
     "Segunda ação concreta e diferenciada para encurtar o caminho entre onde ele está e onde quer chegar.",
     "Terceira ação focada em posicionamento ou técnica."
  ]
}

OBJETIVO DO USUÁRIO: ${goal}
CARGO ALVO: ${targetRole}

CURRÍCULO:
${cleanedResume}`;

                const result = await model.generateContent(prompt);
                let content = result.response.text();
                
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                analyticsJSON = JSON.parse(content);
            } catch (err) {
                console.error("[ONBOARDING] Failed to generate JSON Analytics via Gemini:", err);
            }
        }

        // 7. Salvar na Auth do Supabase
        const { error: updateError } = await supabase.auth.updateUser({
            data: {
                onboarding_completed: true,
                user_context: compiledContext,
                career_analytics: analyticsJSON
            }
        });

        if (updateError) {
            console.error('[ONBOARDING] Update Error:', updateError);
            return NextResponse.json({ error: 'Falha ao salvar os dados na sua conta.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[ONBOARDING] Internal Error:', error);
        return NextResponse.json({ error: 'Erro Interno no Servidor' }, { status: 500 });
    }
}
