'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUp, Target, Briefcase, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
    const router = useRouter();
    const [goal, setGoal] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Por favor, faça upload apenas do arquivo PDF do seu LinkedIn.');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!goal || !targetRole || !file) {
            toast.error('Por favor, preencha todos os campos e faça o upload do PDF.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('goal', goal);
        formData.append('targetRole', targetRole);
        formData.append('pdf', file);

        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao processar as informações de carreira.');
            }

            toast.success('Pilar de Autoridade Construído com sucesso! 🚀');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Erro inesperado.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif text-xl tracking-tight font-medium text-foreground">Career Intelligence</span>
            </div>

            <div className="max-w-xl w-full bg-white border border-border/60 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />
                
                <h1 className="text-3xl font-serif tracking-tight text-foreground mb-3 font-medium">Configure seu Norte Estratégico</h1>
                <p className="text-[14px] text-foreground/60 mb-8 leading-relaxed">
                    A Inteligência Artificial precisa saber com exatidão quem você é e para onde quer ir. Suas respostas abaixo ditarão o tom, a agressividade e o conteúdo de todos os seus posts daqui pra frente.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[14px] font-medium text-foreground/90 flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            1. Qual é o seu objetivo de carreira neste momento?
                        </label>
                        <select
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                        >
                            <option value="" disabled>Selecione seu momento atual...</option>
                            <option value="Promoção Corporativa / Escalada de Cargo">Promoção Corporativa / Escalada de Cargo</option>
                            <option value="Transição de Área / Nova Profissão">Transição de Área / Nova Profissão</option>
                            <option value="Construção de Autoridade para captação de clientes B2B">Construção de Autoridade para captação de clientes B2B / Freelancer</option>
                            <option value="Recolocação no mercado de trabalho / Busca de Vagas">Recolocação no mercado de trabalho / Busca de Vagas urgentes</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[14px] font-medium text-foreground/90 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            2. Para qual cargo/nível você almeja chegar nos próximos 1 a 2 anos?
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Diretor de Engenharia, C-Level, Desenvolvedor Sênior..."
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3.5 text-sm placeholder:text-foreground/40 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-[14px] font-medium text-foreground/90 flex items-center gap-2">
                            <FileUp className="w-4 h-4 text-primary" />
                            3. Suba o PDF do seu Perfil do LinkedIn
                        </label>
                        <p className="text-[12px] text-foreground/50 pb-1">
                            Acesse seu LinkedIn &gt; Botão Mais... &gt; Salvar como PDF. Usaremos isso para ancorar as postagens no seu histórico real e conquistas prévias sem nenhuma alucinação.
                        </p>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-2xl cursor-pointer hover:bg-background/50 hover:border-primary/50 transition-all group relative overflow-hidden">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
                                        <p className="text-[13px] font-medium text-foreground">{file.name}</p>
                                        <p className="text-[11px] text-foreground/50 mt-1">Clique para trocar de arquivo</p>
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-6 h-6 text-foreground/30 group-hover:text-primary transition-colors mb-2" />
                                        <p className="text-[13px] font-medium text-foreground/70">Clique para fazer upload ou arraste o PDF</p>
                                        <p className="text-[11px] text-foreground/40 mt-1">Somente arquivos .pdf</p>
                                    </>
                                )}
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isSubmitting || !goal || !targetRole || !file}
                        className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-medium text-[15px] mt-4 shadow-xl shadow-black/5"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sintetizar Carreira e Iniciar Painel'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
