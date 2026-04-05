import { createClient } from '@/utils/supabase/server'
import { Plus, ChevronRight, Home, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { GeneratorForm } from '../generator-form'
import { TelegramPairing } from '../telegram-pairing'
import HistorySidebar from '../history-sidebar'
import { redirect } from 'next/navigation'

export default async function GeneratorPage(props: { searchParams?: Promise<{ postId?: string }> }) {
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

    const hasGemini = !!user.user_metadata?.gemini_api_key && user.user_metadata?.gemini_api_key.length > 5;

    return (
        <div className="flex flex-1 overflow-hidden relative">
            {/* Historical Sidebar */}
            <HistorySidebar />

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-4 flex flex-col items-center overflow-hidden bg-white/40">
                <div className="w-full max-w-4xl flex flex-col h-full mx-auto">
                    
                    {/* Breadcrumbs and Top Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-6 shrink-0 relative z-50 antialiased border-b border-border/40 pb-4">
                        <div className="flex items-center gap-2 text-[13px] text-foreground/60 bg-white/60 px-3 py-1.5 rounded-full border border-border/50 shadow-sm backdrop-blur-sm">
                            <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                <Home className="w-3.5 h-3.5" /> Início
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5 text-foreground/30" />
                            <Link href="/dashboard/generator" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                Posts
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5 text-foreground/30" />
                            <span className="text-foreground font-medium flex items-center gap-1.5">
                                {postId ? <><Edit3 className="w-3.5 h-3.5 opacity-70" /> Visualizando Histórico</> : <><Plus className="w-3.5 h-3.5 opacity-70" /> Criação de Post</>}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                            {postId && (
                                <Link href="/dashboard/generator" className="flex items-center justify-center gap-2 rounded-full border border-orange-500/30 bg-orange-50 text-orange-700 hover:bg-orange-100 px-4 py-1.5 text-[13px] font-medium transition-all shadow-sm">
                                    <Plus className="w-3.5 h-3.5" /> Criar Novo Post
                                </Link>
                            )}
                            <TelegramPairing
                                isLinked={!!user.user_metadata?.telegram_chat_id}
                                userId={user.id}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-20 w-full no-scrollbar">
                        <GeneratorForm 
                            initialPostData={initialPostData as any} 
                            hasGemini={hasGemini}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
