import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GeneratorForm } from './generator-form'
import { TelegramPairing } from './telegram-pairing'
import { SettingsModal } from './settings-modal'
import HistorySidebar from './history-sidebar'

export default async function DashboardPage(props: { searchParams?: Promise<{ postId?: string }> }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const searchParams = props.searchParams ? await props.searchParams : {}
    const postId = searchParams.postId

    let initialPostData: { topic: string; provider: "openai" | "gemini"; content: string } | null = null
    if (postId) {
        const { data: postData } = await supabase
            .from('posts')
            .select('topic, provider, content')
            .eq('id', postId)
            .eq('user_id', user.id)
            .single()

        if (postData) {
            initialPostData = postData as { topic: string; provider: "openai" | "gemini"; content: string }
        }
    }

    const hasOpenAI = !!user.user_metadata?.openai_api_key && user.user_metadata?.openai_api_key.length > 5;
    const hasGemini = !!user.user_metadata?.gemini_api_key && user.user_metadata?.gemini_api_key.length > 5;

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground relative overflow-hidden">
            
            {/* Dashboard Nav - Soft & Elegant */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 border border-orange-100 text-primary transition-all">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-serif text-[15px] font-medium tracking-tight text-foreground/90">Career Intelligence</span>
                </Link>
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

            {/* Main Area Setup with Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Historical Sidebar */}
                <HistorySidebar />

                {/* Main Content Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-4 flex flex-col items-center overflow-hidden bg-white/40">
                    <div className="w-full max-w-4xl flex flex-col h-full mx-auto">
                        
                        {/* Claude-style top actions */}
                        <div className="flex items-center justify-between w-full mb-2 shrink-0 relative z-50 antialiased">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                                <Link href="/dashboard" className="hidden sm:flex items-center justify-center gap-2 rounded-full border border-border bg-white hover:bg-foreground/5 text-foreground px-4 py-1.5 text-[13px] font-medium transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Novo Post
                                </Link>
                                <TelegramPairing
                                    isLinked={!!user.user_metadata?.telegram_chat_id}
                                    userId={user.id}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-20 w-full no-scrollbar">
                            <GeneratorForm 
                                initialPostData={initialPostData || undefined} 
                                hasOpenAI={hasOpenAI} 
                                hasGemini={hasGemini}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
