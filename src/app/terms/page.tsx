import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">

            {/* Elegant Header */}
            <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="w-full max-w-4xl mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="font-serif text-[16px] font-medium tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            Career Intelligence Platform
                        </span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-[14px] font-medium text-foreground/60 hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </div>
            </header>

            <main className="w-full max-w-3xl mx-auto px-6 py-32 relative z-10">

                <div className="mb-16 pb-10 mt-8">
                    <div className="flex items-center gap-4 mb-4 text-primary">
                        <BookOpen className="w-8 h-8 opacity-80" />
                        <h1 className="text-[2.5rem] sm:text-[3.5rem] font-serif font-medium tracking-tight text-foreground leading-tight">
                            Termos de Uso
                        </h1>
                    </div>
                    <p className="text-[14px] font-medium text-foreground/50 mt-4">
                        Última atualização: 26 de Fevereiro de 2026
                    </p>
                </div>

                <div className="space-y-12 text-[17px] leading-[1.8] text-foreground/80 font-normal">

                    <section className="space-y-4">
                        <h2 className="font-serif text-[22px] font-medium text-foreground mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar a plataforma <strong>Career Intelligence Platform</strong>, você concorda com os termos estabelecidos aqui. Nossa ferramenta atua como um assistente de inteligência artificial focado em criação de conteúdo. A responsabilidade pela publicação e pelos resultados finais nas suas redes sociais (como o LinkedIn) é inteiramente sua.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="font-serif text-[22px] font-medium text-foreground mb-4">2. Segurança e Sem Automação Direta</h2>
                        <p>
                            Nós não nos conectamos diretamente ao seu LinkedIn para fazer postagens automáticas. A Career Intelligence Platform gera o conteúdo através de inteligência artificial e envia para o seu sistema interno.
                        </p>
                        <p>
                            Isso é feito de propósito: copiar e colar o conteúdo manualmente protege a sua conta contra bloqueios ou penalizações por uso de automações proibidas pelas políticas das redes sociais.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="font-serif text-[22px] font-medium text-foreground mb-4">3. Cuidados com a Inteligência Artificial</h2>
                        <p>
                            A inteligência artificial pode ocasionalmente gerar informações conflitantes ou dados incorretos, dependendo dos temas abordados. Recomendamos fortemente que você leia, revise e valide todas as estatísticas, valores financeiros ou dados técnicos antes de publicar o texto na internet.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="font-serif text-[22px] font-medium text-foreground mb-4">4. Atualizações da Plataforma</h2>
                        <p>
                            Reservamo-nos o direito de atualizar nossas regras, limites de uso diário e recursos da plataforma para garantir a melhor estabilidade e segurança para todos os usuários. Alterações significativas serão sempre comunicadas antecipadamente através dos nossos canais oficiais.
                        </p>
                    </section>

                </div>

                <div className="mt-24 pt-8 border-t border-border/50 flex items-center justify-center text-center">
                    <span className="text-[13px] text-foreground/40 font-medium">© {new Date().getFullYear()} Career Intelligence Platform. Todos os direitos reservados.</span>
                </div>
            </main>
        </div>
    );
}
