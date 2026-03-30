'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Bot, RefreshCw, Zap, Clock, LinkIcon, Calendar } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'

export function SettingsModal({ customTrigger }: { customTrigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loadingKeys, setLoadingKeys] = useState(false)
    const [savingKeys, setSavingKeys] = useState(false)
    const [openaiKey, setOpenaiKey] = useState('')
    const [geminiKey, setGeminiKey] = useState('')

    // Automation States
    const [automationLoading, setAutomationLoading] = useState(true)
    const [automationSaving, setAutomationSaving] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [newsSource, setNewsSource] = useState('')
    const [postStyle, setPostStyle] = useState('auto')
    const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]) // Seg a Sex
    const [postsPerDay, setPostsPerDay] = useState<number>(1)

    // Load API Keys
    useEffect(() => {
        if (open) {
            const fetchKeys = async () => {
                setLoadingKeys(true)
                try {
                    const res = await fetch('/api/user/settings')
                    if (res.ok) {
                        const data = await res.json()
                        setOpenaiKey(data.openai_api_key || '')
                        setGeminiKey(data.gemini_api_key || '')
                    }
                } catch (error) {
                    console.error("Failed to load settings", error)
                } finally {
                    setLoadingKeys(false)
                }
            }
            fetchKeys()

            // Load automation settings
            const fetchAutomations = async () => {
                setAutomationLoading(true)
                try {
                    const res = await fetch('/api/automations')
                    if (res.ok) {
                        const data = await res.json()
                        if (data.automation) {
                            const auto = data.automation
                            setIsActive(auto.is_active)
                            setNewsSource(auto.news_source || '')
                            setPostStyle(auto.post_style || 'auto')
                            if (auto.schedule_days) {
                                setScheduleDays(auto.schedule_days.split(',').map(Number))
                            }
                            if (auto.posts_per_day) {
                                setPostsPerDay(auto.posts_per_day)
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to load automations", error)
                } finally {
                    setAutomationLoading(false)
                }
            }
            fetchAutomations()
        }
    }, [open])

    const handleSaveKeys = async () => {
        setSavingKeys(true)
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    openai_api_key: openaiKey,
                    gemini_api_key: geminiKey
                })
            })
            if (res.ok) {
                toast.success('Chaves de API atualizadas!')
            } else {
                toast.error('Erro ao salvar as chaves.')
            }
        } catch (e) {
            toast.error('Erro de conexão ao salvar.')
        } finally {
            setSavingKeys(false)
        }
    }

    const handleSaveAutomation = async (activeOverride?: boolean) => {
        setAutomationSaving(true)
        const newActiveState = activeOverride !== undefined ? activeOverride : isActive;
        if (newActiveState && !newsSource) {
            toast.error('Você deve fornecer um Site Fonte para ligar a automação.')
            setIsActive(false)
            setAutomationSaving(false)
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
                    schedule_days: scheduleDays.join(','),
                    posts_per_day: postsPerDay
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
            setAutomationSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/60 hover:text-foreground rounded-full hover:bg-foreground/5 transition-colors">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/60 bg-white shadow-2xl rounded-3xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="font-serif text-xl tracking-tight">Configurações Avançadas</DialogTitle>
                    <DialogDescription className="text-sm">Gerencie suas chaves de API e automatizações autonômas.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="api-keys" className="w-full">
                    <div className="px-6 border-b border-border/40">
                        <TabsList className="w-full flex h-auto bg-transparent border-none p-0 gap-6">
                            <TabsTrigger 
                                value="api-keys" 
                                className="pb-3 pt-2 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-foreground/50 transition-all flex gap-2 items-center"
                            >
                                <Key className="h-4 w-4" /> API Keys
                            </TabsTrigger>
                            <TabsTrigger 
                                value="autopilot" 
                                className="pb-3 pt-2 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-foreground/50 transition-all flex gap-2 items-center"
                            >
                                <Bot className="h-4 w-4" /> Piloto Automático
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 bg-background/30 h-[480px] overflow-y-auto w-full no-scrollbar">
                        <TabsContent value="api-keys" className="m-0 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[13px] font-medium text-foreground/80 flex items-center gap-2 mb-2">
                                        OpenAI API Key
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                        className="w-full rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    <p className="text-[12px] text-foreground/50 mt-2 px-1">Usada para geração via modelo gpt-4o.</p>
                                </div>
                                <div className="h-px w-full bg-border/40" />
                                <div>
                                    <label className="text-[13px] font-medium text-foreground/80 flex items-center gap-2 mb-2">
                                        Google Gemini API Key
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="AIzaSy..."
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        className="w-full rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    <p className="text-[12px] text-foreground/50 mt-2 px-1">Usada para geração via modelo gemini-pro.</p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleSaveKeys} 
                                disabled={savingKeys || loadingKeys}
                                className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium tracking-tight shadow-sm mt-4"
                            >
                                {savingKeys ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : 'Salvar Chaves'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="autopilot" className="m-0 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {automationLoading ? (
                                <div className="h-full w-full flex items-center justify-center p-10"><RefreshCw className="animate-spin text-foreground/40 h-6 w-6"/></div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between bg-white border border-border/60 p-4 rounded-2xl shadow-sm">
                                        <div>
                                            <p className="font-medium text-foreground text-sm">Status do Robô</p>
                                            <p className="text-[12px] text-foreground/60">{isActive ? 'Postagens em andamento' : 'Pausado'}</p>
                                        </div>
                                        <Switch 
                                            checked={isActive} 
                                            onCheckedChange={(checked) => handleSaveAutomation(checked)}
                                            disabled={automationSaving}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="mb-2 block text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                                            <LinkIcon className="h-3.5 w-3.5" /> Sites Fontes Diários
                                        </label>
                                        <textarea
                                            placeholder="Ex: https://g1.globo.com/economia&#10;https://www.infomoney.com.br/&#10;(Um link por linha)"
                                            value={newsSource}
                                            onChange={(e) => setNewsSource(e.target.value)}
                                            onBlur={() => handleSaveAutomation(isActive)}
                                            className="w-full min-h-[80px] rounded-2xl border border-border/60 bg-white/50 px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="mb-2 block text-[12px] font-medium text-foreground/80 flex items-center gap-1.5">
                                                <Zap className="h-3.5 w-3.5" /> Arquétipo
                                            </label>
                                            <select
                                                value={postStyle}
                                                onChange={(e) => setPostStyle(e.target.value)}
                                                onBlur={() => handleSaveAutomation(isActive)}
                                                className="w-full rounded-xl border border-border/60 bg-white/50 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none pr-8"
                                            >
                                                <option value="auto">Automático 🤖 (A IA escolhe)</option>
                                                <option value="top_voice">Top Voice 🌟</option>
                                                <option value="case_study">Case Sucesso</option>
                                                <option value="storytelling">Storytelling</option>
                                                <option value="technical_tutorial">Técnico</option>
                                                <option value="contrarian">Polêmica 🔥</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border/40">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" /> Dias da Semana permitidos
                                            </label>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {[
                                                { label: 'Dom', val: 0 }, { label: 'Seg', val: 1 },
                                                { label: 'Ter', val: 2 }, { label: 'Qua', val: 3 },
                                                { label: 'Qui', val: 4 }, { label: 'Sex', val: 5 },
                                                { label: 'Sab', val: 6 }
                                            ].map(day => {
                                                const selected = scheduleDays.includes(day.val);
                                                return (
                                                    <button
                                                        key={day.val}
                                                        onClick={() => {
                                                            const newDays = selected ? scheduleDays.filter(d => d !== day.val) : [...scheduleDays, day.val].sort();
                                                            setScheduleDays(newDays);
                                                        }}
                                                        onBlur={() => handleSaveAutomation(isActive)}
                                                        className={`h-8 w-10 text-[12px] font-medium rounded-lg transition-all border ${
                                                            selected 
                                                            ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20' 
                                                            : 'bg-white/50 border-border/60 text-foreground/50 hover:bg-black/5 hover:text-foreground/80'
                                                        }`}
                                                    >
                                                        {day.label}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="mb-2 block text-[13px] font-medium text-foreground/80 flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5" /> Limite Diário
                                                </label>
                                                <select
                                                    value={postsPerDay}
                                                    onChange={(e) => setPostsPerDay(parseInt(e.target.value))}
                                                    onBlur={() => handleSaveAutomation(isActive)}
                                                    className="w-full rounded-xl border border-border/60 bg-white/50 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none pr-8"
                                                >
                                                    <option value={1}>1 Post por dia (Espaçado)</option>
                                                    <option value={2}>2 Posts por dia (A cada 12h)</option>
                                                    <option value={3}>3 Posts por dia (Manhã, Tarde, Noite)</option>
                                                    <option value={4}>4 Posts por dia (A cada 6h)</option>
                                                </select>
                                                <p className="text-[11px] text-foreground/50 mt-1 pl-1">Se rodar mais de 1 vez, a IA espaça o envio para evitar flood.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-foreground/50 italic px-1">O robô roda no CRON Job sempre 1h antes do pico.</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
