"use client"

import Link from "next/link";
import { ArrowRight, Bot, Target, Shield, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";

// Reusable animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">

      {/* Modern Claude-like Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="w-full max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-100/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-serif text-[18px] font-medium tracking-tight text-foreground/90">
              Career Intelligence 
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-[14px]">
            <Link href="#como-funciona" className="text-foreground/60 hover:text-foreground transition-colors">
              Como Funciona
            </Link>
            <Link href="/planos" className="text-foreground/60 hover:text-foreground transition-colors">
              Planos e Preços
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-[14px] font-medium text-background hover:bg-foreground/90 transition-all shadow-sm"
          >
            Entrar no Sistema <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 relative z-10 w-full max-w-5xl mx-auto px-6 pt-32 sm:pt-48 pb-20">

        {/* Core Hero Section */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col items-center text-center justify-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border border-border/60 bg-white/50 px-4 py-1.5 text-[13px] font-medium text-foreground/70 mb-8 w-fit shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            A forma inteligente de criar conteúdo no LinkedIn
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-[3.5rem] sm:text-[5rem] lg:text-[6rem] font-serif font-medium tracking-tight text-foreground leading-[1.1] mb-8">
            Sua autoridade <br />
            <span className="text-foreground/80 italic">criada por IA.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="max-w-2xl text-[18px] sm:text-[20px] leading-[1.6] text-foreground/60 font-medium mb-12">
            Crie postagens profissionais, atraia as conexões certas e escale sua presença na principal rede corporativa do mundo sem perder horas escrevendo.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-[15px] font-medium text-white transition-all hover:bg-primary/90 shadow-md hover:shadow-lg"
            >
              Começar Agora
            </Link>
            <Link
              href="/planos"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border/80 bg-white px-8 text-[15px] font-medium text-foreground transition-all hover:bg-foreground/5 shadow-sm"
            >
              Ver Planos de Assinatura
            </Link>
          </motion.div>
        </motion.section>

        {/* Technical Specs Array */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          id="como-funciona"
          className="py-24 sm:py-32 mt-32"
        >
          <motion.div variants={fadeInUp} className="mb-16 text-center">
            <h2 className="text-[14px] text-primary/80 mb-3 font-semibold tracking-wide uppercase">Vantagens Essenciais</h2>
            <h3 className="text-[2.5rem] font-serif font-medium tracking-tight text-foreground">Criado para quem lidera.</h3>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Box 1 */}
            <motion.div variants={fadeInUp} className="bg-card border border-border/50 rounded-3xl p-8 hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
                <Target className="text-primary w-6 h-6" />
              </div>
              <h4 className="text-[20px] font-serif font-medium text-foreground mb-3">Escrita Profissional</h4>
              <p className="text-[16px] leading-relaxed text-foreground/60">
                Nossa inteligência entende o tom exato do mundo corporativo. Transforme ideias vagas em textos prontos para engajar, com formato adequado para o LinkedIn.
              </p>
            </motion.div>

            {/* Box 2 */}
            <motion.div variants={fadeInUp} className="bg-card border border-border/50 rounded-3xl p-8 hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
                <Shield className="text-primary w-6 h-6" />
              </div>
              <h4 className="text-[20px] font-serif font-medium text-foreground mb-3">Segurança Total</h4>
              <p className="text-[16px] leading-relaxed text-foreground/60">
                Sem riscos para sua conta. A Career Intelligence Platform não posta automaticamente sem sua autorização, protegendo seu perfil de shadowbans.
              </p>
            </motion.div>

            {/* Box 3 */}
            <motion.div variants={fadeInUp} className="bg-card border border-border/50 rounded-3xl p-8 hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
                <Bot className="text-primary w-6 h-6" />
              </div>
              <h4 className="text-[20px] font-serif font-medium text-foreground mb-3">Integração Telegram</h4>
              <p className="text-[16px] leading-relaxed text-foreground/60">
                Para máxima praticidade, entregamos os textos prontos pelo Bot do Telegram. Rápido e prático para você copiar, ajustar e publicar.
              </p>
            </motion.div>

          </div>
        </motion.section>

        {/* Scaled-down CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-24 border border-border/50 bg-white shadow-xl shadow-black-[0.02] rounded-3xl mt-12 flex flex-col items-center justify-center text-center px-6 relative"
        >
          <h2 className="text-[2.5rem] font-serif font-medium tracking-tight text-foreground mb-6">
            Pronto para escalar seu perfil?
          </h2>
          <p className="text-foreground/60 mb-10 max-w-xl text-[18px]">
            Acesse nossos planos e garanta seu domínio no jogo corporativo de conteúdo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/planos"
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-[15px] font-medium text-background transition-all hover:bg-foreground/90 shadow-md"
            >
              Ver Tabela de Preços
            </Link>
          </div>
        </motion.section>

      </main>

      {/* Modern Footer */}
      <footer className="border-t border-border/50 bg-background py-12 mt-10">
        <div className="w-full max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[14px] text-foreground/50 font-medium">
            <span>Career Intelligence Platform</span>
            <span>&copy; {new Date().getFullYear()} Soluções Corporativas</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[14px] font-medium">
            <Link href="/planos" className="text-foreground/50 hover:text-foreground transition-colors">Ver Planos de Assinatura</Link>
            <Link href="/terms" className="text-foreground/50 hover:text-foreground transition-colors">Termos de Uso e Privacidade</Link>
            <Link href="/login" className="text-foreground/50 hover:text-foreground transition-colors">Acessar Sistema</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
