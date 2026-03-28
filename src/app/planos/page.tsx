"use client"

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Zap, Gem } from "lucide-react";
import { useState } from "react";
import { motion, Variants } from "framer-motion";

// Animation Variants
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function PlanosPage() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">

            {/* Modern Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="w-full max-w-6xl flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="h-4 w-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                        <span className="text-[14px] font-medium text-foreground/50 group-hover:text-foreground transition-colors">Voltar</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="font-serif text-[16px] font-medium tracking-tight text-foreground/90">
                            Career Intelligence Platform
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-6 pt-32 pb-20">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-3xl mx-auto text-center mb-16 relative"
                >
                    <h1 className="text-[3rem] sm:text-[4.5rem] font-serif font-medium tracking-tight text-foreground leading-[1.05] mb-6">
                        Níveis de Acesso
                    </h1>
                    <p className="text-[18px] leading-[1.6] text-foreground/60 font-medium mb-10 max-w-xl mx-auto">
                        Aumente sua autoridade profissional sem esforço manual. Escolha o poder computacional adequado para a sua estratégia.
                    </p>

                    {/* Annual Toggle */}
                    <div className="flex items-center justify-center gap-4 text-[14px] font-medium">
                        <span className={!isAnnual ? "text-foreground" : "text-foreground/40"}>Mensal</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-14 h-7 rounded-full bg-border/50 border border-border/80 relative transition-colors focus:outline-none focus:ring-2 ring-primary/30"
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-[3px] transition-all ${isAnnual ? 'left-[calc(100%-24px)] bg-primary' : 'left-[4px]'}`} />
                        </button>
                        <span className={isAnnual ? "text-foreground flex items-center gap-2" : "text-foreground/40 flex items-center gap-2"}>
                            Anual
                            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                -20% OFF
                            </span>
                        </span>
                    </div>
                </motion.div>

                {/* Pricing Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start"
                >

                    {/* Tier 1: Free */}
                    <motion.div variants={fadeUp} className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10 flex flex-col hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
                        <div className="mb-6 mt-2">
                            <h3 className="text-[13px] text-foreground/50 font-semibold tracking-wide uppercase mb-2">Plano Grátis</h3>
                            <h4 className="text-[28px] font-serif font-medium text-foreground">Iniciante</h4>
                        </div>

                        <div className="flex items-baseline gap-2 mb-8 border-b border-border/40 pb-8">
                            <span className="text-[3.5rem] font-medium tracking-tight text-foreground leading-none">0</span>
                            <span className="text-[14px] font-medium text-foreground/50">BRL / Mês</span>
                        </div>

                        <ul className="space-y-4 flex-1 mb-10">
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed"><strong>Restrito a 3 posts</strong> gerados por semana</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed">Apenas inteligência artificial comum</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed">Integração com o robô via Telegram</span>
                            </li>
                        </ul>

                        <Link href="/login" className="flex h-12 items-center justify-center rounded-full text-[14px] font-medium border border-border/80 bg-white text-foreground hover:bg-foreground/5 transition-all shadow-sm">
                            Começar de Graça
                        </Link>
                    </motion.div>

                    {/* Tier 2: The Upsell (Pro) */}
                    <motion.div variants={fadeUp} className="bg-card border-2 border-primary/20 rounded-3xl p-8 lg:p-10 flex flex-col relative z-10 shadow-2xl shadow-primary/5 hover:scale-[1.02] transition-transform duration-300">

                        {/* Highlight Badge */}
                        <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                            <Zap className="w-3 h-3 fill-white" /> Mais Escalonável
                        </div>

                        <div className="mb-6 mt-2">
                            <h3 className="text-[13px] text-primary font-semibold tracking-wide uppercase mb-2">Crescimento Rápido</h3>
                            <h4 className="text-[28px] font-serif font-medium text-foreground flex items-center gap-2">
                                Engenharia Viral
                            </h4>
                        </div>

                        <div className="flex items-baseline gap-2 mb-8 border-b border-border/40 pb-8">
                            <span className="text-[3.5rem] font-medium tracking-tight text-foreground leading-none">
                                {isAnnual ? "29" : "37"}
                            </span>
                            <span className="text-[14px] font-medium text-foreground/50">BRL / Mês</span>
                        </div>

                        <ul className="space-y-4 flex-1 mb-10">
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground font-medium leading-relaxed">Libera 20 Postagens Avançadas por dia</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/70 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/80 leading-relaxed">Acesso a IAs Premium Globais (GPT-4)</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/70 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/80 leading-relaxed">Leitor URL: Cole links e gere posts a partir de grandes notícias.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/70 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/80 leading-relaxed">Proteção Avançada para o perfil</span>
                            </li>
                        </ul>

                        <Link href="/login" className="flex h-12 items-center justify-center rounded-full text-[15px] font-medium bg-primary text-white hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
                            Assinar Engenharia Viral
                        </Link>
                    </motion.div>

                    {/* Tier 3: Enterprise */}
                    <motion.div variants={fadeUp} className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10 flex flex-col hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
                        <div className="mb-6 mt-2">
                            <h3 className="text-[13px] text-foreground/50 font-semibold tracking-wide uppercase mb-2">Para Grandes Equipes</h3>
                            <h4 className="text-[28px] font-serif font-medium text-foreground">Agência</h4>
                        </div>

                        <div className="flex items-baseline gap-2 mb-8 border-b border-border/40 pb-8">
                            <span className="text-[3.5rem] font-medium tracking-tight text-foreground leading-none">
                                {isAnnual ? "77" : "97"}
                            </span>
                            <span className="text-[14px] font-medium text-foreground/50">BRL / Mês</span>
                        </div>

                        <ul className="space-y-4 flex-1 mb-10">
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed"><strong>Geração Ilimitada</strong> sem travas.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed">Gestão de múltiplas contas de clientes.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary/40 mr-3 shrink-0" />
                                <span className="text-[15px] text-foreground/70 leading-relaxed">Suporte prioritário (VIP) com especialistas.</span>
                            </li>
                        </ul>

                        <Link href="/login" className="flex h-12 items-center justify-center rounded-full text-[14px] font-medium border border-border/80 bg-white text-foreground hover:bg-foreground/5 transition-all shadow-sm">
                            Contratar Pacote
                        </Link>
                    </motion.div>

                </motion.div>

            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-background py-10 relative z-20">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-[14px] text-foreground/50 font-medium">
                        <span>Career Intelligence Platform</span>
                        <span>&copy; {new Date().getFullYear()} Soluções Corporativas</span>
                    </div>

                    <div className="flex gap-6 text-[14px] font-medium">
                        <Link href="/terms" className="text-foreground/50 hover:text-foreground transition-colors">Termos de Uso</Link>
                        <Link href="/login" className="text-foreground/50 hover:text-foreground transition-colors">Acessar</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
