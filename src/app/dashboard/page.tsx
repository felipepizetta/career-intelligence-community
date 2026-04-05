import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Target, TrendingUp, Compass, Award, ExternalLink, Lightbulb, BrainCircuit } from 'lucide-react'
import Link from 'next/link'

export default async function InsightsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    if (user.user_metadata?.onboarding_completed !== true) {
        return redirect('/onboarding')
    }

    const analytics = user.user_metadata?.career_analytics || {
        current_status: "Aguardando análise real do seu perfil...",
        top_skills: ["Capacidade Adaptativa", "Resolução de Problemas", "Gestão de Tempo"],
        action_plan: ["Complete seu onboarding preenchendo o PDF e inserindo a chave Gemini para desbloquear sua rota de crescimento e métricas reais."]
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white/40">
            <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 lg:pt-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif tracking-tight text-foreground/90 font-medium flex items-center gap-3">
                            <BrainCircuit className="w-7 h-7 text-orange-500" /> Raio-X de Carreira
                        </h1>
                        <p className="text-[15px] text-foreground/60 mt-1.5 max-w-2xl leading-relaxed">
                            Inteligência processada a partir do seu histórico. Aqui estão as suas maiores fortalezas decodificadas pela IA e o plano tático sugerido para o seu próximo nível.
                        </p>
                    </div>
                </div>

                {analytics.current_status && (
                    <div className="bg-orange-50/50 border border-orange-200/60 rounded-3xl p-6 mb-2 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Compass className="w-5 h-5 text-orange-600" />
                            <h2 className="font-semibold text-[17px] tracking-tight text-zinc-800">Cenário Atual Identificado</h2>
                        </div>
                        <p className="text-[15px] text-zinc-700 leading-relaxed font-medium">
                            {analytics.current_status}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Skills & Authority */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-border/60 shadow-lg shadow-black/[0.02] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Award className="w-32 h-32 text-orange-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-orange-500" />
                                <h2 className="font-semibold text-[17px] tracking-tight text-zinc-800">Principais Habilidades</h2>
                            </div>
                            <div className="flex flex-wrap gap-2.5 relative z-10">
                                {analytics.top_skills.map((skill: string, idx: number) => (
                                    <span key={idx} className="bg-orange-50 text-orange-800 border border-orange-200/60 px-3.5 py-1.5 rounded-xl text-[13px] font-semibold tracking-tight shadow-sm transition-all hover:bg-orange-100 cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[13px] text-zinc-500 mt-6 leading-relaxed">
                                Baseado na análise semântica das experiências registradas no seu último LinkedIn PDF.
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-border/60 shadow-lg shadow-black/[0.02]">
                            <div className="flex items-center gap-2 mb-4">
                                <Compass className="w-5 h-5 text-zinc-500" />
                                <h2 className="font-semibold text-[17px] tracking-tight text-zinc-800">Direcionamento Mestre</h2>
                            </div>
                            <p className="text-[14px] text-zinc-600 leading-relaxed">
                                Nossa Máquina Neural usa esse mapa para ditar o tom das suas postagens no LinkedIn. O objetivo contínuo é transparecer autoridade natural sem parecer forçado.
                            </p>
                            <Link href="/dashboard/generator" className="mt-8 flex items-center justify-center gap-2 w-full bg-foreground text-background py-3 rounded-2xl text-[14px] font-medium hover:bg-foreground/90 transition-all shadow-xl shadow-black/10">
                                Acessar Criador de Conteúdo <ExternalLink className="w-4 h-4 opacity-70" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Action Plan Roadmap */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 lg:p-10 border border-border/60 shadow-lg shadow-black/[0.02]">
                            <div className="flex items-center justify-between mb-8 pb-5 border-b border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center shadow-inner">
                                        <TrendingUp className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-xl tracking-tight text-zinc-900">Plano de Ação Estratégico</h2>
                                        <p className="text-[13px] text-zinc-500 font-medium">Os 3 passos arquitetados pela IA para alcançar sua meta</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[18px] md:before:ml-[22px] before:h-[90%] before:w-0.5 before:bg-gradient-to-b before:from-orange-300 before:via-orange-200 before:to-transparent mt-6 lg:ml-2">
                                {analytics.action_plan.map((step: string, idx: number) => (
                                    <div key={idx} className="relative flex items-start group">
                                        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-[5px] border-white bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold text-[14px] md:text-[16px] absolute -left-1 shadow-sm shrink-0 ring-1 ring-orange-200 z-10">
                                            {idx + 1}
                                        </div>
                                        <div className="pl-14 md:pl-20 pt-1 md:pt-2 w-full">
                                            <div className="bg-zinc-50 hover:bg-orange-50/30 border border-border/40 rounded-2xl p-5 md:p-6 transition-all shadow-sm group-hover:shadow-md group-hover:border-orange-200/60 w-full">
                                                <h3 className="text-[11px] text-orange-600 font-bold tracking-widest uppercase mb-2.5 flex items-center gap-1.5 opacity-80">
                                                    <Lightbulb className="w-3.5 h-3.5" /> Fase {idx + 1}
                                                </h3>
                                                <p className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-800 font-medium tracking-tight">
                                                    {step}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
