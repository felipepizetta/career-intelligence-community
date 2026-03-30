'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Send, Loader2, Sparkles, Linkedin, LinkIcon, X, Newspaper, Search, Info } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsModal } from './settings-modal'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
    topic: z.string()
        .min(10, { message: 'Context must be at least 10 characters.' })
        .max(10000, { message: 'Context is too long. Please keep it under 10000 characters.' }),
    provider: z.enum(['openai', 'gemini']),
    postLength: z.enum(['short', 'medium', 'long']),
    postStyle: z.enum(['top_voice', 'case_study', 'technical_tutorial', 'storytelling', 'contrarian']),
})

export function GeneratorForm({ 
    initialPostData, 
    hasOpenAI = false, 
    hasGemini = false 
}: { 
    initialPostData?: { topic: string; provider: "openai" | "gemini"; content: string },
    hasOpenAI?: boolean,
    hasGemini?: boolean
}) {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)
    const [lastGeneratedPost, setLastGeneratedPost] = useState(initialPostData?.content || '')
    const hasAnyKey = hasOpenAI || hasGemini;

    // News Extractor States
    const [isLinkMode, setIsLinkMode] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractedArticles, setExtractedArticles] = useState<{ title: string, summary?: string, url?: string, [key: string]: any }[]>([])

    const [isExtractingArticle, setIsExtractingArticle] = useState(false)
    const [loadingArticleUrl, setLoadingArticleUrl] = useState('')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            topic: '',
            provider: 'openai',
            postLength: 'medium',
            postStyle: 'top_voice',
        },
    })

    useEffect(() => {
        if (initialPostData) {
            setLastGeneratedPost(initialPostData.content)
            form.setValue('topic', '', { shouldValidate: false })
            form.setValue('provider', initialPostData.provider, { shouldValidate: true })
        } else {
            setLastGeneratedPost('')
            form.setValue('topic', '', { shouldValidate: false })
            const defaultProv = hasOpenAI ? 'openai' : (hasGemini ? 'gemini' : 'openai');
            form.setValue('provider', defaultProv as any, { shouldValidate: false })
        }
    }, [initialPostData, form, hasOpenAI, hasGemini])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsGenerating(true)
        setLastGeneratedPost('')

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to generate post')
            }

            const data = await response.json()
            setLastGeneratedPost(data.content)
            
            if (data.telegramSent) {
                toast.success('Post gerado e enviado para o Telegram!')
            } else {
                toast.success('Post gerado! (Vincule seu Telegram para receber por lá)')
            }
            
            form.reset({ provider: values.provider, postLength: values.postLength, postStyle: values.postStyle, topic: '' })
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'An error occurred during generation.')
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleExtractNews() {
        if (!linkUrl.trim() || !linkUrl.startsWith('http')) {
            toast.error('Por favor insira um link válido (iniciando com http ou https)')
            return
        }

        setIsExtracting(true)
        setExtractedArticles([])

        try {
            const cacheBuster = Date.now()
            const res = await fetch(`/api/extract-news?cb=${cacheBuster}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkUrl }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Falha ao extrair notícias da página')
            }

            const data = await res.json()
            if (data.articles && data.articles.length > 0) {
                setExtractedArticles(data.articles)
                toast.success('Página analisada com sucesso!')
            } else {
                toast.error('Nenhuma notícia/manchete encontrada nessa página.')
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro inesperado na extração.')
        } finally {
            setIsExtracting(false)
        }
    }

    async function useArticleAsTopic(article: { title: string, url?: string }) {
        if (!article.url || !article.url.startsWith('http')) {
            toast.error('Este portal omitiu o link direto. Tente com outro cartão.')
            return
        }

        setIsExtractingArticle(true)
        setLoadingArticleUrl(article.url)

        try {
            const res = await fetch('/api/extract-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: article.url }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'A proteção do site bloqueou o robô de leitura dessa matéria.')
            }

            const data = await res.json()
            const richContext = data.content

            const text = `Título da matéria: ${article.title}\n Texto da matéria: \n${richContext}`

            form.setValue('topic', text, { shouldValidate: true })
            toast.success('🎉 Imersão Profunda! O texto da matéria inteira foi injetado (Leia e depois Submit).')
            setIsLinkMode(false)
            setExtractedArticles([])
            setLinkUrl('')
        } catch (error: any) {
            toast.error(error.message || 'Erro inesperado ao escanear as entranhas da matéria.')
        } finally {
            setIsExtractingArticle(false)
            setLoadingArticleUrl('')
        }
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full font-sans text-foreground overflow-hidden relative">

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto w-full px-4 sm:px-6 pb-8 flex flex-col pt-4 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
                {isGenerating ? (
                    <div className="flex gap-4 max-w-3xl w-full mx-auto animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-orange-100/50 border border-orange-200 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-primary opacity-50" />
                        </div>
                        <div className="space-y-4 w-full pt-1">
                            <div className="h-4 w-3/4 rounded bg-border"></div>
                            <div className="h-4 w-full rounded bg-border"></div>
                            <div className="h-4 w-5/6 rounded bg-border"></div>
                            <div className="h-4 w-2/3 rounded bg-border"></div>
                        </div>
                    </div>
                ) : lastGeneratedPost ? (
                    <div className="flex gap-4 max-w-3xl w-full mx-auto group">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mt-1">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-[#2d2d2d] text-[16px] leading-[1.7] bg-white border border-border/60 shadow-sm p-6 rounded-3xl rounded-tl-sm relative overflow-hidden transition-all">
                            <div className="whitespace-pre-wrap break-words">{lastGeneratedPost}</div>

                            <div className="mt-8 pt-4 flex border-t border-border/60">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(lastGeneratedPost);
                                        toast.success('Texto copiado! Redirecionando para o LinkedIn...');
                                        setTimeout(() => {
                                            window.open('https://www.linkedin.com/feed/', '_blank');
                                        }, 1500);
                                    }}
                                    className="bg-white border-border/80 hover:bg-foreground/5 text-foreground transition-all text-[13px] font-medium rounded-full px-5 py-2 shadow-sm"
                                >
                                    <Linkedin className="mr-2 h-4 w-4 text-[#0A66C2]" />
                                    Preparar Post no LinkedIn
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pb-[15vh] mt-auto">
                        <div className="w-12 h-12 flex items-center justify-center bg-orange-50 border border-orange-100 rounded-2xl shadow-sm">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        {/* THE ORIGINAL TEXT RESTORED IN CLAUDE FONT */}
                        <h3 className="text-3xl sm:text-4xl font-serif tracking-tight text-foreground leading-tight font-medium max-w-xl">
                            Como posso ajudar com o seu próximo post no LinkedIn?
                        </h3>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 w-full px-4 sm:px-6 pb-6 pt-2 relative">
                <div className="max-w-3xl w-full mx-auto relative">

                    {/* Extractor Bubble */}
                    {isLinkMode && (
                        <div className="absolute bottom-full left-4 right-4 mb-4 z-20">
                            <div className="bg-white border border-border/60 p-4 rounded-3xl shadow-xl shadow-black/5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2 text-foreground/90 text-[14px] font-medium">
                                        <Newspaper className="w-4 h-4 text-primary" />
                                        Extrair Notícias de um Site (IA)
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsLinkMode(false)} className="h-6 w-6 rounded-full hover:bg-foreground/5 text-foreground/50 hover:text-foreground">
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="Cole a URL de um site (ex: https://g1.globo.com/)"
                                        className="flex-1 bg-background border border-border/60 rounded-full px-5 py-2 text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text font-sans shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleExtractNews()
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleExtractNews}
                                        disabled={isExtracting || !linkUrl}
                                        className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm shrink-0 disabled:opacity-50 text-[13px]"
                                    >
                                        {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extrair Mágica'}
                                    </Button>
                                </div>

                                {extractedArticles.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10 pr-2">
                                        {extractedArticles.map((article, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => useArticleAsTopic(article)}
                                                disabled={isExtractingArticle}
                                                className="w-full text-left bg-background/50 hover:bg-white border border-transparent hover:border-border/60 hover:shadow-sm disabled:opacity-50 disabled:cursor-wait rounded-2xl p-4 transition-all relative block"
                                            >
                                                <div className="text-foreground text-[14px] font-medium leading-normal mb-1">
                                                    {article.title || article['Titulo'] || article['titulo'] || article['Title'] || 'Faça extração'}
                                                </div>

                                                {(article.url || article.href || article.link) && (
                                                    <div className="text-foreground/50 text-[12px] break-all group">
                                                        {(() => {
                                                            try {
                                                                return new URL(article.url || article.href || article.link || '').hostname.replace('www.', '')
                                                            } catch (e) { return 'link' }
                                                        })()}
                                                    </div>
                                                )}

                                                {loadingArticleUrl === article.url && (
                                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-2 rounded-2xl z-20">
                                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                        <span className="ml-2.5 text-[13px] font-medium text-foreground">Lendo artigo completo...</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 relative">
                            <fieldset disabled={isGenerating}>

                                <FormField
                                    control={form.control}
                                    name="topic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                {/* Claude's iconic floating pill-shaped input */}
                                                <div className="relative group flex flex-col w-full bg-white shadow-[0_4px_30px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.05)] rounded-3xl border border-border/40 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
                                                    <Textarea
                                                        placeholder="Do que você quer falar hoje? Digite seu tema central ou contexto..."
                                                        className="min-h-[120px] max-h-[260px] overflow-y-auto w-full resize-none border-0 bg-transparent text-foreground placeholder:text-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-6 pt-5 pb-16 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent rounded-3xl text-[16px] leading-[1.6] block"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                if (!isGenerating && form.getValues().topic.trim().length >= 10) {
                                                                    form.handleSubmit(onSubmit)();
                                                                }
                                                            }
                                                        }}
                                                        {...field}
                                                    />

                                                    {/* Bottom Toolbar inside the input */}
                                                    <div className="absolute bottom-3 left-4 right-3 flex justify-between items-end pointer-events-none">

                                                        <div className="flex items-center gap-2 pointer-events-auto">
                                                            
                                                            {/* Model Selector or API Missing Warning */}
                                                            {hasAnyKey ? (
                                                                <FormField
                                                                    control={form.control}
                                                                    name="provider"
                                                                    render={({ field }) => (
                                                                        <FormItem className="space-y-0">
                                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger className="h-8 rounded-full bg-background/50 hover:bg-background border border-border/50 text-foreground/70 hover:text-foreground focus:ring-0 shadow-none text-[12px] font-medium px-4 transition-colors w-auto gap-2">
                                                                                        <SelectValue placeholder="Model" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent className="bg-white border border-border/60 shadow-xl rounded-2xl min-w-[150px] p-1">
                                                                                    {hasOpenAI && <SelectItem value="openai" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">OpenAI (GPT-4o)</SelectItem>}
                                                                                    {hasGemini && <SelectItem value="gemini" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Google Gemini</SelectItem>}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            ) : (
                                                                <SettingsModal 
                                                                    customTrigger={
                                                                        <Button type="button" variant="outline" className="h-8 rounded-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-[12px] font-medium px-4 transition-colors shadow-none cursor-pointer">
                                                                            Nenhuma chave de API cadastrada
                                                                        </Button>
                                                                    }
                                                                />
                                                            )}

                                                            {/* Style Selector */}
                                                            <FormField
                                                                control={form.control}
                                                                name="postStyle"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-0">
                                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                            <FormControl>
                                                                                <SelectTrigger className="h-8 rounded-full bg-background/50 hover:bg-background border border-border/50 text-foreground/70 hover:text-foreground focus:ring-0 shadow-none text-[12px] font-medium px-4 transition-colors w-auto gap-2 flex-shrink-0">
                                                                                    <SelectValue placeholder="Estilo do Post" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent className="bg-white border border-border/60 shadow-xl rounded-2xl min-w-[200px] p-1 z-[999]">
                                                                                <SelectItem value="top_voice" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Top Voice 🌟</SelectItem>
                                                                                <SelectItem value="case_study" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Case (Resultados) 📈</SelectItem>
                                                                                <SelectItem value="technical_tutorial" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Tutorial Técnico 🛠️</SelectItem>
                                                                                <SelectItem value="storytelling" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Storytelling 📖</SelectItem>
                                                                                <SelectItem value="contrarian" className="focus:bg-foreground/5 cursor-pointer rounded-xl font-medium text-[13px] py-2 px-3">Contrarian (Polêmica) 🔥</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            {/* Option: URL Extractor */}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setIsLinkMode(!isLinkMode);
                                                                }}
                                                                className={`rounded-full transition-colors shadow-none text-[12px] font-medium h-8 px-4 flex-shrink-0 hidden sm:flex ${isLinkMode ? 'bg-primary/10 text-primary' : 'bg-background/50 text-foreground/60 hover:bg-background hover:text-foreground'}`}
                                                            >
                                                                <LinkIcon className="w-3.5 h-3.5 mr-2" />
                                                                URL Extrair
                                                            </Button>

                                                        </div>

                                                        {/* Submit Area */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-foreground/30 text-[12px] font-medium hidden sm:inline-block pointer-events-none">
                                                                Return to send
                                                            </span>

                                                            <Button
                                                                type="submit"
                                                                disabled={isGenerating || field.value.trim().length < 10 || !hasAnyKey}
                                                                size="icon"
                                                                className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/30 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 z-10 pointer-events-auto"
                                                            >
                                                                {isGenerating ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-4 w-4 ml-[2px]" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <div className="px-4 mt-2">
                                                <FormMessage className="text-destructive text-[13px]" />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </fieldset>
                        </form>
                    </Form>

                    {/* RESTORED ORIGINAL TEXT */}
                    <div className="text-center mt-4">
                        <span className="text-foreground/40 text-[12px] font-medium">
                            Career Intelligence Platform Generator can make mistakes. Consider verifying important information.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
