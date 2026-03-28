'use client'

import { useState, useEffect } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, KeyRound, ShieldAlert, CheckSquare } from 'lucide-react'

export default function LoginPage() {
    const [isHuman, setIsHuman] = useState(false)
    const [isVerifying, setIsVerifying] = useState(true)

    // Simulate Cloudflare Turnstile verification
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVerifying(false)
            setIsHuman(true)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">

            <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center items-center">
                <div className="absolute h-[30rem] w-[30rem] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <Link
                href="/"
                className="absolute left-6 top-6 sm:left-10 sm:top-10 flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors font-mono text-[12px] z-20 hover:bg-foreground/5 px-3 py-1.5 rounded"
            >
                <ArrowLeft className="h-3 w-3" /> Voltar ao Início
            </Link>

            <div className="w-full max-w-[400px] border border-border bg-card p-8 z-10 relative">

                <div className="flex items-center gap-3 mb-10">
                    <div className="h-8 w-8 rounded bg-foreground/5 border border-border flex items-center justify-center">
                        <KeyRound className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-medium tracking-tight text-foreground">Acesse sua conta</h1>
                        <p className="font-mono text-[11px] text-foreground/50">Entre com as suas credenciais</p>
                    </div>
                </div>

                <form className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="font-mono text-[11px] text-foreground/60">E-MAIL</label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="seu@email.com"
                            type="email"
                            required
                            className="h-10 rounded bg-background border-border focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 text-foreground placeholder:text-foreground/30 transition-all font-mono text-[13px] shadow-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="font-mono text-[11px] text-foreground/60">SENHA DE ACESSO</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="h-10 rounded bg-background border-border focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 text-foreground placeholder:text-foreground/30 transition-all font-mono text-[13px] shadow-none"
                        />
                    </div>

                    {/* Developer Terminal Anti-Bot */}
                    <div className="mt-6 p-4 border border-border border-l-2 border-l-primary bg-background flex items-center justify-between font-mono">
                        <div className="flex items-center gap-3">
                            <span className={`text-[11px] ${isVerifying ? 'text-foreground/40 animate-pulse' : 'text-primary'}`}>
                                {isVerifying ? 'Verificando segurança...' : 'Conexão validada com sucesso'}
                            </span>
                        </div>
                        {isVerifying ? <ShieldAlert className="h-3 w-3 text-foreground/20" /> : <CheckSquare className="h-3 w-3 text-primary" />}
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                        <Button
                            formAction={login}
                            disabled={!isHuman}
                            className="w-full h-10 rounded font-mono text-[12px] bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                        >
                            Entrar
                        </Button>
                        <Button
                            formAction={signup}
                            disabled={!isHuman}
                            variant="outline"
                            className="w-full h-10 rounded border border-border font-mono text-[12px] bg-transparent text-foreground hover:bg-foreground/5 disabled:opacity-50 transition-colors"
                        >
                            Criar Nova Conta
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
