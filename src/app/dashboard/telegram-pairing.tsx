'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Copy, RefreshCw, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TelegramPairingProps {
    isLinked: boolean;
    userId: string;
}

export function TelegramPairing({ isLinked, userId }: TelegramPairingProps) {
    const router = useRouter()
    const [isVerifying, setIsVerifying] = useState(false)
    const [pairingCode, setPairingCode] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        if (userId) {
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
                hash = (hash << 5) - hash + userId.charCodeAt(i);
                hash |= 0;
            }
            const code = Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
            setPairingCode(code);
        }
    }, [userId])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pairingCode)
        toast.success('Código copiado!')
    }

    const verifyConnection = async () => {
        setIsVerifying(true)
        try {
            const res = await fetch('/api/telegram/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: pairingCode })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Conta vinculada ao Telegram!')
                router.refresh()
            } else {
                toast.error(data.error || 'Falha na verificação. Código foi enviado ao bot?')
            }
        } catch (err) {
            toast.error('Ocorreu um erro durante a verificação.')
        } finally {
            setIsVerifying(false)
        }
    }

    const unlinkConnection = async () => {
        if (!confirm('Deseja desvincular o seu Telegram?')) return;
        setIsVerifying(true)
        try {
            const res = await fetch('/api/telegram/unlink', { method: 'POST' })
            if (res.ok) {
                toast.success('Telegram desconectado!')
                router.refresh()
            } else {
                toast.error('Falha ao desconectar.')
            }
        } catch (err) {
            toast.error('Ocorreu um erro ao tentar desconectar.')
        } finally {
            setIsVerifying(false)
        }
    }

    if (isLinked) {
        return (
            <button 
                onClick={unlinkConnection}
                disabled={isVerifying}
                className="group flex items-center gap-2 rounded-full border border-border/80 bg-white px-3 py-1.5 shadow-sm transition-all hover:bg-red-50 hover:border-red-200 cursor-pointer disabled:opacity-50"
            >
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] group-hover:bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-colors" />
                <span className="text-[12px] font-medium text-foreground/80 group-hover:text-red-600 transition-colors">
                    {isVerifying ? 'Desconectando...' : 'Telegram Conectado (Sair)'}
                </span>
            </button>
        )
    }

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-white hover:bg-foreground/5 text-foreground px-4 py-1.5 text-[13px] font-medium transition-all shadow-sm"
            >
                <Smartphone className="w-4 h-4 text-foreground/70" /> Conectar Telegram
            </button>

            {isExpanded && (
                <div className="absolute top-full mt-3 left-0 sm:left-auto sm:right-0 w-[300px] sm:w-[340px] z-[999] rounded-3xl border border-border/80 bg-white p-5 flex flex-col gap-4 shadow-xl shadow-black/20 overflow-hidden origin-top-left sm:origin-top-right animate-in fade-in slide-in-from-top-2">
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className=" absolute top-4 right-4 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full p-1.5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3 border-b border-border/40 pb-3 pr-8">
                        <div className="p-2 bg-background rounded-full border border-border/50">
                            <Smartphone className="w-4 h-4 text-foreground/70" />
                        </div>
                        <div>
                            <span className="text-[14px] font-semibold text-foreground">Conectar Telegram</span>
                            <p className="text-[12px] text-foreground/50">Receba os posts na sua mão</p>
                        </div>
                    </div>

                    <div className="text-[13px] text-foreground/70 space-y-4">
                        <p className="leading-snug">1. Abra o bot <a href="https://t.me/trajanofeedbot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">@trajanofeedbot</a></p>
                        <p className="leading-snug">2. Envie o código abaixo para o bot:</p>

                        <div className="flex items-center gap-2 bg-background border border-border/60 p-1.5 rounded-2xl group focus-within:ring-2 ring-primary/20 transition-all">
                            <code className="text-lg font-mono font-medium text-foreground tracking-[0.2em] flex-1 text-center pl-2">
                                {pairingCode}
                            </code>
                            <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-9 w-9 text-foreground/50 hover:bg-white hover:text-foreground rounded-xl bg-white shadow-sm border border-border/40">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={verifyConnection}
                        disabled={isVerifying || !pairingCode}
                        className="w-full mt-2 bg-foreground text-background hover:bg-foreground/90 font-medium text-[13px] rounded-full h-11 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Já enviei, confirmar!</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
