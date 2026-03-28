import { createClient } from '@/utils/supabase/server'
import { CalendarDays, MessageSquare } from 'lucide-react'
import { ClearHistoryButton, DeleteHistoryButton } from './history-actions'
import Link from 'next/link'

async function getHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

    return posts || []
}

export default async function HistorySidebar() {
    const posts = await getHistory()

    return (
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-sidebar border-r border-border/50 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10 shrink-0">
            <div className="p-4 flex items-center justify-between text-foreground/50 font-medium text-[12px] uppercase mb-1 border-b border-border/40 pb-3 tracking-wide">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>Seus Projetos</span>
                </div>
                <ClearHistoryButton disabled={posts.length === 0} />
            </div>

            <div className="flex flex-col px-3 space-y-1 pb-6 relative z-10 pt-2">
                {posts.length === 0 ? (
                    <div className="text-foreground/40 text-[13px] italic px-4 py-6 text-center">
                        Nenhum post gerado ainda. Aqui aparecerão seus textos.
                    </div>
                ) : (
                    posts.map((post: any) => (
                        <div key={post.id} className="relative group flex items-start justify-between p-3 rounded-xl hover:bg-white shadow-[0_0_0_1px_transparent] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition-all cursor-pointer">
                            <Link
                                href={`?postId=${post.id}`}
                                className="flex flex-col text-foreground flex-1 min-w-0"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[14px] font-medium leading-snug truncate pr-2 text-foreground/80 group-hover:text-primary transition-colors">
                                        {post.topic.substring(0, 35)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="text-[11px] bg-foreground/5 border border-border/50 px-2 py-0.5 rounded-md text-foreground/60 font-medium">
                                        {post.provider}
                                    </div>
                                    <span className="text-[11px] text-foreground/40 font-medium">
                                        {new Date(post.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </Link>

                            <div className="ml-1 z-20 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteHistoryButton postId={post.id} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    )
}
