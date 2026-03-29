'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
// Fallback switch used
import { Bot, LinkIcon, Zap, Clock } from 'lucide-react'

export function AutomationCard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [newsSource, setNewsSource] = useState('')
    const [postStyle, setPostStyle] = useState('top_voice')
    const [frequency, setFrequency] = useState(1)

    // Fetch initial automation data
    useEffect(() => {
        const fetchAutomations = async () => {
            try {
                const res = await fetch('/api/automations')
                if (res.ok) {
                    const data = await res.json()
                    if (data.automation) {
                        setIsActive(data.automation.is_active)
                        setNewsSource(data.automation.news_source || '')
                        setPostStyle(data.automation.post_style || 'top_voice')
                        setFrequency(data.automation.frequency_days || 1)
                    }
                }
            } catch (error) {
                console.error("Failed to load automations", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAutomations()
    }, [])

    const handleSave = async (activeOverride?: boolean) => {
        setSaving(true)
        const newActiveState = activeOverride !== undefined ? activeOverride : isActive;
        if (newActiveState && !newsSource) {
            toast.error('Você deve fornecer um Site Fonte para ligar a automação.')
            setIsActive(false)
            setSaving(false)
            return
        }

        try {
            const res = await fetch('/api/automations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: newActiveState,
                    news_source: newsSource,
                    post_style: postStyle,
                    frequency_days: frequency
                })
            })

            if (res.ok) {
                setIsActive(newActiveState)
                toast.success(newActiveState ? '⚡ Piloto Automático ativado!' : '⏸ Piloto Automático pausado.')
            } else {
                toast.error('Erro ao salvar as configurações.')
                setIsActive(!newActiveState)
            }
        } catch (error) {
            toast.error('Erro de conexão.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null

    return (
        <div className="mt-8 rounded-[32px] border border-border/50 bg-background/50 p-6 md:p-8 backdrop-blur-xl max-w-2xl mx-auto shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border/40 pb-5 mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">Piloto Automático (Beta)</h3>
                        <p className="text-sm text-foreground/60">Gere e entregue conteudos nos horários de pico (08:30 às Terças e Quintas).</p>
                    </div>
                </div>
                
                {/* Fallback Switch using literal Divs if shadcn <Switch> isn't available */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => handleSave(!isActive)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? 'bg-orange-500' : 'bg-input'}`}
                >
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="mb-2 block text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                        <LinkIcon className="h-3.5 w-3.5" /> Site Favorito para Raspagem
                    </label>
                    <input
                        type="url"
                        placeholder="Ex: https://g1.globo.com/economia"
                        value={newsSource}
                        onChange={(e) => setNewsSource(e.target.value)}
                        onBlur={() => handleSave(isActive)}
                        className="w-full rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-2 block text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" /> Arquétipo de Escrita
                        </label>
                        <select
                            value={postStyle}
                            onChange={(e) => {
                                setPostStyle(e.target.value)
                            }}
                            onBlur={() => handleSave(isActive)}
                            className="w-full rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iI2EwYTBhMCI+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNNy4yOTMgMTQuNzA3YTEgMSAwIDAxMC0xLjQxNEwxMC41ODYgMTBsLTMuMjkzLTMuMjkzYTEgMSAwIDExMS40MTQtMS40MTRsNCA0YTEgMSAwIDAxMCAxLjQxNGwtNCA0YTEgMSAwIDAxLTEuNDE0IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+Cjwvc3ZnPg==')] bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
                        >
                            <option value="top_voice">Top Voice 🌟</option>
                            <option value="case_study">Case Sucesso 📈</option>
                            <option value="storytelling">Storytelling 📖</option>
                            <option value="technical_tutorial">Passo a Passo 🛠️</option>
                            <option value="contrarian">Polêmica (Debate) 🔥</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Frequência
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => {
                                setFrequency(parseInt(e.target.value))
                            }}
                            onBlur={() => handleSave(isActive)}
                            className="w-full rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iI2EwYTBhMCI+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNNy4yOTMgMTQuNzA3YTEgMSAwIDAxMC0xLjQxNEwxMC41ODYgMTBsLTMuMjkzLTMuMjkzYTEgMSAwIDExMS40MTQtMS40MTRsNCA0YTEgMSAwIDAxMCAxLjQxNGwtNCA0YTEgMSAwIDAxLTEuNDE0IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+Cjwvc3ZnPg==')] bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
                        >
                            <option value={1}>Entregar todo dia de pico (1 dia)</option>
                            <option value={3}>A cada 3 dias</option>
                            <option value={7}>Apenas 1 por semana (7 dias)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}
