'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Trash, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function DeleteHistoryButton({ postId }: { postId: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete(e: React.MouseEvent) {
        e.preventDefault() // prevent navigating to the link
        e.stopPropagation()
        setIsDeleting(true)

        try {
            const res = await fetch('/api/history/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            })

            if (!res.ok) throw new Error('Falha ao deletar')

            toast.success('Post removido do histórico!')

            // If they are currently viewing the post that got deleted, reset param
            const currentUrl = new URL(window.location.href)
            if (currentUrl.searchParams.get('postId') === postId) {
                router.push('/dashboard')
            }

            // Next.js App Router drastically caches Server Components.
            // A hard refresh ensures the sidebar fetches the latest Supabase state.
            window.location.reload()
        } catch (error) {
            toast.error('Não foi possível remover o post.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Deletar este post"
            className="p-1.5 shrink-0 rounded-md text-[#ef4444]/40 hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-all opacity-100 lg:opacity-30 lg:group-hover:opacity-100 disabled:opacity-50"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
        </button>
    )
}

export function ClearHistoryButton({ disabled }: { disabled: boolean }) {
    const router = useRouter()
    const [isClearing, setIsClearing] = useState(false)

    async function handleClear() {
        if (!window.confirm('Tem certeza que deseja apagar TODO o seu histórico de postagens geradas? Esta ação é irreversível.')) {
            return
        }

        setIsClearing(true)

        try {
            const res = await fetch('/api/history/clear', { method: 'POST' })
            if (!res.ok) throw new Error('Falha ao limpar histórico')

            toast.success('Histórico apagado completamente!')
            router.push('/dashboard') // Resets URL to clear any selected postId
        } catch (error) {
            toast.error('Ocorreu um erro ao limpar o histórico.')
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isClearing || disabled}
            className="h-7 px-2 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] rounded-md font-medium text-xs transition-colors"
        >
            {isClearing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
            Limpar
        </Button>
    )
}
