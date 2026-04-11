import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SettingsModal } from './settings-modal'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground relative overflow-hidden print:overflow-visible print:h-auto print:block">
            {/* Dashboard Nav - Soft & Elegant */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-6 print:hidden">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 border border-orange-100 text-primary transition-all">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-serif text-[15px] font-medium tracking-tight text-foreground/90">Career Intelligence</span>
                    </Link>
                    
                    {/* New Header Navigation Links */}
                    <nav className="hidden md:flex items-center gap-5 ml-4">
                        <Link href="/dashboard" className="text-[14px] font-medium text-foreground/70 hover:text-foreground transition-colors hover:bg-foreground/5 px-3 py-1.5 rounded-full">
                            Visão Geral
                        </Link>
                        <Link href="/dashboard/generator" className="text-[14px] font-medium text-foreground/70 hover:text-foreground transition-colors hover:bg-foreground/5 px-3 py-1.5 rounded-full">
                            Criador de Posts
                        </Link>
                        <Link href="/dashboard/resume" className="text-[14px] font-medium text-foreground/70 hover:text-foreground transition-colors hover:bg-foreground/5 px-3 py-1.5 rounded-full">
                            Currículo Inteligente
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground/50 hidden sm:inline-block">
                            {user.email}
                        </span>
                        <SettingsModal />
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full text-[13px] font-medium transition-colors px-3 h-8">
                            Sair <LogOut className="ml-2 h-3.5 w-3.5 opacity-70" />
                        </Button>
                    </form>
                </div>
            </header>

            {/* Child Pages are rendered here */}
            {children}
        </div>
    )
}
