'use client'

import { useState, useEffect } from 'react'
import { FileUp, Save, Briefcase, GraduationCap, MapPin, Mail, Phone, ExternalLink, Printer, Plus, Trash2, ChevronUp, ChevronDown, Wand2, Loader2, Linkedin, Github, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function ResumeBuilderPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [resumeData, setResumeData] = useState<any>(null)
    const [resumeId, setResumeId] = useState<string | null>(null)
    const [isExtractingIdx, setIsExtractingIdx] = useState<number | null>(null)
    const [isPolishingSummary, setIsPolishingSummary] = useState(false)
    const [isPolishingSkills, setIsPolishingSkills] = useState(false)
    const [polishingExpIdx, setPolishingExpIdx] = useState<number | null>(null)
    
    // Tipografia Executive Ouro
    const [selectedFont, setSelectedFont] = useState<string>('garamond')
    const fontMapping: Record<string, string> = {
        'garamond': '"EB Garamond", Garamond, serif',
        'georgia': 'Georgia, serif',
        'times': '"Times New Roman", Times, serif',
        'helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
        'calibri': 'Calibri, "Segoe UI", sans-serif'
    };

    useEffect(() => {
        const fetchResume = async () => {
            try {
                const res = await fetch('/api/resume')
                if (res.ok) {
                    const data = await res.json()
                    if (data.resume) {
                        setResumeData(data.resume.content)
                        setResumeId(data.resume.id)
                    }
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchResume()
    }, [])

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            toast.error('O arquivo precisa ser um PDF.')
            return
        }

        setIsGenerating(true)
        const formData = new FormData()
        formData.append('pdf', file)

        try {
            const res = await fetch('/api/resume', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (res.ok && data.resume) {
                setResumeData(data.resume.content)
                setResumeId(data.resume.id)
                toast.success('Currículo gerado com sucesso!')
            } else {
                toast.error(data.error || 'Falha ao processar PDF.')
            }
        } catch (error) {
            toast.error('Erro de conexão ao gerar currículo.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/resume', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: resumeData, id: resumeId })
            })

            if (res.ok) {
                toast.success('Currículo salvo com sucesso!')
            } else {
                toast.error('Erro ao salvar as edições.')
            }
        } catch (error) {
            toast.error('Erro de conexão ao salvar.')
        } finally {
            setIsSaving(false)
        }
    }

    const printDocument = () => {
        window.print()
    }

    // Editable Inputs Generic Handler
    const updatePersonal = (field: string, value: string) => {
        setResumeData({ ...resumeData, personal: { ...resumeData.personal, [field]: value } })
    }

    const addCustomLink = () => {
        const links = resumeData.personal?.customLinks || []
        setResumeData({ ...resumeData, personal: { ...resumeData.personal, customLinks: [...links, { label: '', url: '' }] } })
    }

    const updateCustomLink = (index: number, field: string, value: string) => {
        const links = [...(resumeData.personal?.customLinks || [])]
        links[index][field] = value
        setResumeData({ ...resumeData, personal: { ...resumeData.personal, customLinks: links } })
    }

    const removeCustomLink = (index: number) => {
        const links = [...(resumeData.personal?.customLinks || [])]
        links.splice(index, 1)
        setResumeData({ ...resumeData, personal: { ...resumeData.personal, customLinks: links } })
    }

    const updateExperience = (index: number, field: string, value: any) => {
        const exp = [...resumeData.experience]
        exp[index][field] = value
        setResumeData({ ...resumeData, experience: exp })
    }
    
    const updateExperienceBullets = (index: number, bullets: string) => {
        const exp = [...resumeData.experience]
        exp[index].description = bullets.split('\n').filter(b => b.trim() !== '')
        setResumeData({ ...resumeData, experience: exp })
    }

    // Handle scroll position reset for perfect printing
    useEffect(() => {
        const rightPane = document.getElementById('right-preview-pane');
        let scrollPos = 0;
        
        const handleBeforePrint = () => {
            if (rightPane) {
                scrollPos = rightPane.scrollTop;
                rightPane.scrollTop = 0;
            }
        };
        
        const handleAfterPrint = () => {
            if (rightPane) {
                rightPane.scrollTop = scrollPos;
            }
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);
        
        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    const addExperience = () => {
        const newExp = { company: '', position: '', period: '', description: [] }
        setResumeData({ ...resumeData, experience: [...(resumeData.experience || []), newExp] })
    }

    const removeExperience = (index: number) => {
        const exp = [...resumeData.experience]
        exp.splice(index, 1)
        setResumeData({ ...resumeData, experience: exp })
    }

    const moveExperience = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === (resumeData.experience?.length || 0) - 1) return
        const exp = [...resumeData.experience]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = exp[index]
        exp[index] = exp[targetIndex]
        exp[targetIndex] = temp
        setResumeData({ ...resumeData, experience: exp })
    }

    const updateEducation = (index: number, field: string, value: any) => {
        const edu = [...resumeData.education]
        edu[index][field] = value
        setResumeData({ ...resumeData, education: edu })
    }

    const addEducation = () => {
        const newEdu = { institution: '', degree: '', period: '' }
        setResumeData({ ...resumeData, education: [...(resumeData.education || []), newEdu] })
    }

    const removeEducation = (index: number) => {
        const edu = [...resumeData.education]
        edu.splice(index, 1)
        setResumeData({ ...resumeData, education: edu })
    }

    const moveEducation = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === (resumeData.education?.length || 0) - 1) return
        const edu = [...resumeData.education]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = edu[index]
        edu[index] = edu[targetIndex]
        edu[targetIndex] = temp
        setResumeData({ ...resumeData, education: edu })
    }

    const updateProject = (index: number, field: string, value: any) => {
        const proj = [...(resumeData.projects || [])]
        if (!proj[index]) return;
        proj[index][field] = value
        setResumeData({ ...resumeData, projects: proj })
    }

    const addProject = () => {
        const newProj = { name: '', description: '', url: '' }
        setResumeData({ ...resumeData, projects: [...(resumeData.projects || []), newProj] })
    }

    const removeProject = (index: number) => {
        const proj = [...(resumeData.projects || [])]
        proj.splice(index, 1)
        setResumeData({ ...resumeData, projects: proj })
    }

    const moveProject = (index: number, direction: 'up' | 'down') => {
        const pArr = resumeData.projects || []
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === pArr.length - 1) return
        const proj = [...pArr]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = proj[index]
        proj[index] = proj[targetIndex]
        proj[targetIndex] = temp
        setResumeData({ ...resumeData, projects: proj })
    }

    const updateCertification = (index: number, field: string, value: any) => {
        const cert = [...(resumeData.certifications || [])]
        if (!cert[index]) return;
        cert[index][field] = value
        setResumeData({ ...resumeData, certifications: cert })
    }

    const addCertification = () => {
        const newCert = { name: '', issuer: '', year: '' }
        setResumeData({ ...resumeData, certifications: [...(resumeData.certifications || []), newCert] })
    }

    const removeCertification = (index: number) => {
        const cert = [...(resumeData.certifications || [])]
        cert.splice(index, 1)
        setResumeData({ ...resumeData, certifications: cert })
    }

    const moveCertification = (index: number, direction: 'up' | 'down') => {
        const cArr = resumeData.certifications || []
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === cArr.length - 1) return
        const cert = [...cArr]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = cert[index]
        cert[index] = cert[targetIndex]
        cert[targetIndex] = temp
        setResumeData({ ...resumeData, certifications: cert })
    }

    const handleExtractGitHub = async (index: number, url: string) => {
        if (!url || !url.includes('github.com')) {
            toast.error('Coloque uma URL válida do GitHub. Ex: github.com/user/repo');
            return;
        }

        setIsExtractingIdx(index);
        try {
            const res = await fetch('/api/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            
            if (!res.ok) {
                toast.error(data.error || 'Falha ao processar o repositório.');
            } else if (data.project) {
                const proj = [...(resumeData.projects || [])];
                if (proj[index]) {
                    proj[index].name = data.project.name || proj[index].name;
                    proj[index].description = data.project.description || proj[index].description;
                    setResumeData({ ...resumeData, projects: proj });
                    toast.success('Repositório analisado com Sucesso!');
                }
            }
        } catch (error) {
            toast.error('Erro de conexão ao extrair o repositório.');
        } finally {
            setIsExtractingIdx(null);
        }
    }

    const handlePolishSummary = async () => {
        if (!resumeData.summary) return;
        setIsPolishingSummary(true);
        try {
            const res = await fetch('/api/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: resumeData.summary, type: 'summary' })
            });
            const data = await res.json();
            if (data.polishedText) {
                setResumeData({ ...resumeData, summary: data.polishedText });
                toast.success('Resumo otimizado com IA!');
            } else throw new Error(data.error);
        } catch(e) {
            toast.error('Erro ao conectar com a IA.');
        } finally {
            setIsPolishingSummary(false);
        }
    }

    const handlePolishSkills = async () => {
        const skillsText = (resumeData.skills || []).join('; ');
        if (!skillsText.trim()) return;
        setIsPolishingSkills(true);
        try {
            const res = await fetch('/api/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: skillsText, type: 'skills' })
            });
            const data = await res.json();
            if (data.polishedText) {
                const returnedSkills = data.polishedText
                    .split(';')
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                setResumeData({ ...resumeData, skills: returnedSkills });
                toast.success('Competências otimizadas com IA!');
            } else throw new Error(data.error);
        } catch(e) {
            toast.error('Erro ao conectar com a IA.');
        } finally {
            setIsPolishingSkills(false);
        }
    }

    const handlePolishExperience = async (idx: number) => {
        const text = (resumeData.experience[idx].description || []).join('\n');
        if (!text.trim()) return;
        setPolishingExpIdx(idx);
        try {
            const res = await fetch('/api/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type: 'experience' })
            });
            const data = await res.json();
            if (data.polishedText) {
                const bulletArray = data.polishedText.split('\n').filter((l: string) => l.trim() !== '');
                const exp = [...resumeData.experience];
                exp[idx].description = bulletArray;
                setResumeData({ ...resumeData, experience: exp });
                toast.success('Tópicos reescritos para ATS!');
            } else throw new Error(data.error);
        } catch(e) {
            toast.error('Erro ao conectar com a IA.');
        } finally {
            setPolishingExpIdx(null);
        }
    }

    const updateLanguage = (index: number, field: string, value: any) => {
        const lang = [...(resumeData.languages || [])]
        if (!lang[index]) return;
        lang[index][field] = value
        setResumeData({ ...resumeData, languages: lang })
    }

    const addLanguage = () => {
        const newLang = { name: '', level: '' }
        setResumeData({ ...resumeData, languages: [...(resumeData.languages || []), newLang] })
    }

    const removeLanguage = (index: number) => {
        const lang = [...(resumeData.languages || [])]
        lang.splice(index, 1)
        setResumeData({ ...resumeData, languages: lang })
    }

    if (isLoading) {
        return <main className="flex-1 p-8 bg-zinc-50 flex items-center justify-center">Carregando...</main>
    }

    // STATE 1: UPLOAD
    if (!resumeData) {
        return (
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-zinc-50">
                <div className="max-w-2xl mx-auto mt-10">
                    <div className="bg-white p-10 rounded-3xl border border-border shadow-sm text-center">
                        <div className="w-16 h-16 bg-zinc-100 text-zinc-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FileUp className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-serif font-medium text-zinc-900 mb-2">Currículo Vazio</h2>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                            O nosso sistema ainda não gerou o seu currículo inteligente. Para gerar um agora mesmo de forma automática, clique na <strong className="text-zinc-800">Engrenagem de Configurações</strong> no canto superior da tela, abra a aba <strong className="text-zinc-800">Perfil</strong> e envie seu arquivo <strong>Profile.pdf</strong> exportado do LinkedIn.
                        </p>
                    </div>
                </div>
            </main>
        )
    }

    // STATE 2: EDITOR & PREVIEW
    return (
        <main className="flex-1 h-full overflow-hidden flex flex-col md:flex-row bg-zinc-100 print:overflow-visible print:h-auto print:bg-white print:block">
            {/* LEFT: EDITOR SIDEBAR */}
            <div className="w-full md:w-1/3 lg:w-[400px] bg-white border-r border-border h-full overflow-y-auto print:hidden flex flex-col hide-scrollbar">
                <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-border p-4 z-10 flex justify-between items-center shadow-sm">
                    <h2 className="font-semibold text-zinc-800">Editor</h2>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={printDocument} title="Imprimir PDF">
                            <Printer className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? '...' : 'Salvar'}
                        </Button>
                    </div>
                </div>
                
                <div className="p-5 space-y-8 pb-32">
                    {/* Estilo & Tipografia */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Design / Tipografia</h3>
                        <div>
                            <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Fonte do Currículo (Executivo)</label>
                            <select 
                                value={selectedFont} 
                                onChange={(e) => setSelectedFont(e.target.value)} 
                                className="w-full border border-border rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white font-medium text-zinc-700"
                            >
                                <option value="garamond">Garamond (Clássica)</option>
                                <option value="georgia">Georgia (Moderna Serif)</option>
                                <option value="times">Times New Roman (Tradicional)</option>
                                <option value="helvetica">Helvetica / Arial (Moderna Sans)</option>
                                <option value="calibri">Calibri (Contemporânea)</option>
                            </select>
                        </div>
                    </div>

                    {/* Seção Pessoal */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Informações Pessoais</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Nome</label>
                                <input value={resumeData.personal?.name || ''} onChange={e => updatePersonal('name', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Cargo Alvo</label>
                                <input value={resumeData.personal?.title || ''} onChange={e => updatePersonal('title', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[12px] font-medium text-zinc-500 mb-1 block">E-mail</label>
                                    <input value={resumeData.personal?.email || ''} onChange={e => updatePersonal('email', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Telefone</label>
                                    <input value={resumeData.personal?.phone || ''} onChange={e => updatePersonal('phone', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Localização</label>
                                    <input value={resumeData.personal?.location || ''} onChange={e => updatePersonal('location', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="Ex: São Paulo, BR" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-zinc-500 mb-1 block">LinkedIn</label>
                                    <input value={resumeData.personal?.linkedin || ''} onChange={e => updatePersonal('linkedin', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="URL do Perfil" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Portfólio / Site</label>
                                <input value={resumeData.personal?.portfolio || ''} onChange={e => updatePersonal('portfolio', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="Link do seu Portfólio ou Site" />
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <label className="text-[12px] font-medium text-zinc-500 mb-1 block">Links Extras (Opcional)</label>
                                {(resumeData.personal?.customLinks || []).map((link: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <input value={link.label} onChange={e => updateCustomLink(idx, 'label', e.target.value)} placeholder="Nome (Ex: Medium)" className="w-1/3 border border-border rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:border-orange-400" />
                                        <input value={link.url} onChange={e => updateCustomLink(idx, 'url', e.target.value)} placeholder="URL do Link" className="flex-1 border border-border rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:border-orange-400" />
                                        <button onClick={() => removeCustomLink(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addCustomLink} className="text-zinc-500 hover:text-orange-600 bg-transparent h-auto py-1 px-2 text-xs w-full justify-start mt-1">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Link Extra
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Resumo Profissional</h3>
                            <button onClick={handlePolishSummary} disabled={isPolishingSummary || !resumeData.summary} className="text-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all flex items-center gap-1.5 text-[11px] font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                                {isPolishingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Wand2 className="w-3.5 h-3.5"/>} Otimizar IA
                            </button>
                        </div>
                        <textarea 
                            value={resumeData.summary || ''} 
                            onChange={e => setResumeData({ ...resumeData, summary: e.target.value })} 
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-1 focus:ring-orange-500" 
                        />
                    </div>

                    {/* Experiências */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Experiência</h3>
                        {(resumeData.experience || []).map((exp: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-border/60 rounded-xl p-4 space-y-3 relative group transition-all">
                                <div className="flex justify-between items-start gap-2">
                                    <input value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} placeholder="Empresa" className="w-full bg-transparent border-b border-border/50 pb-1 text-sm font-semibold focus:outline-none focus:border-orange-400" />
                                    <div className="flex gap-0.5">
                                        <button onClick={() => moveExperience(idx, 'up')} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para cima">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveExperience(idx, 'down')} disabled={idx === (resumeData.experience?.length || 0) - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para baixo">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => removeExperience(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1 ml-1" title="Remover Experiência">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={exp.position} onChange={e => updateExperience(idx, 'position', e.target.value)} placeholder="Cargo" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                    <input value={exp.period} onChange={e => updateExperience(idx, 'period', e.target.value)} placeholder="Ex: Jan 2020 - Atual" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                </div>
                                <input value={exp.companyUrl || ''} onChange={e => updateExperience(idx, 'companyUrl', e.target.value)} placeholder="Link da empresa (opcional, ex: site ou linkedin)" className="w-full bg-transparent border-b border-border/50 pb-1 text-[12px] text-zinc-500 focus:outline-none focus:border-orange-400" />
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[11px] font-medium text-zinc-400">Tópicos de impacto (1 por linha)</label>
                                        <button onClick={() => handlePolishExperience(idx)} disabled={polishingExpIdx === idx} className="text-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all flex items-center gap-1 text-[10px] font-semibold">
                                            {polishingExpIdx === idx ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} IA Polish
                                        </button>
                                    </div>
                                    <textarea 
                                        value={(exp.description || []).join('\n')} 
                                        onChange={e => updateExperienceBullets(idx, e.target.value)} 
                                        className="w-full border border-border/50 rounded-lg px-2 py-1.5 text-[12px] min-h-[100px] focus:outline-none focus:border-orange-400 bg-white" 
                                    />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addExperience} className="w-full text-zinc-500 border-dashed border-2 hover:border-orange-300 hover:text-orange-600 bg-transparent">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Experiência
                        </Button>
                    </div>

                    {/* Educação */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Formação Acadêmica</h3>
                        {(resumeData.education || []).map((edu: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-border/60 rounded-xl p-4 space-y-3 relative group transition-all">
                                <div className="flex justify-between items-start gap-2">
                                    <input value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="Curso / Grau (Ex: Bacharel em TI)" className="w-full bg-transparent border-b border-border/50 pb-1 text-sm font-semibold focus:outline-none focus:border-orange-400" />
                                    <div className="flex gap-0.5">
                                        <button onClick={() => moveEducation(idx, 'up')} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para cima">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveEducation(idx, 'down')} disabled={idx === (resumeData.education?.length || 0) - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para baixo">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => removeEducation(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1 ml-1" title="Remover Formação">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} placeholder="Instituição" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                    <input value={edu.period} onChange={e => updateEducation(idx, 'period', e.target.value)} placeholder="Ex: 2018 - 2022" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addEducation} className="w-full text-zinc-500 border-dashed border-2 hover:border-orange-300 hover:text-orange-600 bg-transparent">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Formação
                        </Button>
                    </div>

                    {/* Projetos */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Projetos / Portfólio</h3>
                        {(resumeData.projects || []).map((proj: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-border/60 rounded-xl p-4 space-y-3 relative group transition-all">
                                <div className="flex justify-between items-start gap-2">
                                    <input value={proj.name} onChange={e => updateProject(idx, 'name', e.target.value)} placeholder="Nome do Projeto" className="w-full bg-transparent border-b border-border/50 pb-1 text-sm font-semibold focus:outline-none focus:border-orange-400" />
                                    <div className="flex gap-0.5">
                                        <button onClick={() => moveProject(idx, 'up')} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para cima">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveProject(idx, 'down')} disabled={idx === (resumeData.projects?.length || 0) - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para baixo">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => removeProject(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1 ml-1" title="Remover Projeto">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center border-b border-border/50 pb-1 focus-within:border-orange-400 focus-within:ring-0">
                                    <input value={proj.url} onChange={e => updateProject(idx, 'url', e.target.value)} placeholder="Link Ex: github.com/..." className="w-full bg-transparent text-[13px] text-zinc-700 focus:outline-none" />
                                    <button 
                                        onClick={() => handleExtractGitHub(idx, proj.url)} 
                                        disabled={isExtractingIdx === idx || !proj.url || !proj.url.includes('github')}
                                        className="ml-2 text-zinc-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                                        title="Extrair Resume do GitHub com IA"
                                    >
                                        {isExtractingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Descrição do Projeto</label>
                                    <textarea 
                                        value={proj.description || ''} 
                                        onChange={e => updateProject(idx, 'description', e.target.value)} 
                                        className="w-full border border-border/50 rounded-lg px-2 py-1.5 text-[12px] min-h-[60px] focus:outline-none focus:border-orange-400 bg-white" 
                                    />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addProject} className="w-full text-zinc-500 border-dashed border-2 hover:border-orange-300 hover:text-orange-600 bg-transparent">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Projeto
                        </Button>
                    </div>

                    {/* Certificados */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Certificações</h3>
                        {(resumeData.certifications || []).map((cert: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-border/60 rounded-xl p-4 space-y-3 relative group transition-all">
                                <div className="flex justify-between items-start gap-2">
                                    <input value={cert.name} onChange={e => updateCertification(idx, 'name', e.target.value)} placeholder="Título do Certificado" className="w-full bg-transparent border-b border-border/50 pb-1 text-sm font-semibold focus:outline-none focus:border-orange-400" />
                                    <div className="flex gap-0.5">
                                        <button onClick={() => moveCertification(idx, 'up')} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para cima">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveCertification(idx, 'down')} disabled={idx === (resumeData.certifications?.length || 0) - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors p-1" title="Mover para baixo">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => removeCertification(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1 ml-1" title="Remover Certificado">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={cert.issuer} onChange={e => updateCertification(idx, 'issuer', e.target.value)} placeholder="Emissor (ex: AWS)" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                    <input value={cert.year} onChange={e => updateCertification(idx, 'year', e.target.value)} placeholder="Ano/Período" className="w-full bg-transparent border-b border-border/50 pb-1 text-[13px] focus:outline-none focus:border-orange-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={cert.credentialId || ''} onChange={e => updateCertification(idx, 'credentialId', e.target.value)} placeholder="ID da Credencial" className="w-full bg-transparent border-b border-border/50 pb-1 text-[12px] font-mono focus:outline-none focus:border-orange-400" />
                                    <input value={cert.url || ''} onChange={e => updateCertification(idx, 'url', e.target.value)} placeholder="URL do Selo" className="w-full bg-transparent border-b border-border/50 pb-1 text-[12px] text-zinc-500 focus:outline-none focus:border-orange-400" />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addCertification} className="w-full text-zinc-500 border-dashed border-2 hover:border-orange-300 hover:text-orange-600 bg-transparent">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Certificação
                        </Button>
                    </div>

                    {/* Idiomas */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Idiomas</h3>
                        {(resumeData.languages || []).map((lang: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-border/60 rounded-xl p-3 relative group transition-all flex gap-3 items-center">
                                <input value={lang.name} onChange={e => updateLanguage(idx, 'name', e.target.value)} placeholder="Idioma (Ex: Inglês)" className="flex-1 bg-transparent border-b border-border/50 pb-1 text-sm font-semibold focus:outline-none focus:border-orange-400" />
                                <input value={lang.level} onChange={e => updateLanguage(idx, 'level', e.target.value)} placeholder="Nível (Ex: Fluente)" className="w-[100px] bg-transparent border-b border-border/50 pb-1 text-[13px] text-zinc-500 focus:outline-none focus:border-orange-400" />
                                <button onClick={() => removeLanguage(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="Remover Idioma">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addLanguage} className="w-full text-zinc-500 border-dashed border-2 hover:border-orange-300 hover:text-orange-600 bg-transparent">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Idioma
                        </Button>
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Competências</h3>
                            <button onClick={handlePolishSkills} disabled={isPolishingSkills || !resumeData.skills || resumeData.skills.length === 0} className="text-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all flex items-center gap-1.5 text-[11px] font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                                {isPolishingSkills ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Wand2 className="w-3.5 h-3.5"/>} Otimizar IA
                            </button>
                        </div>
                        <textarea 
                             value={(resumeData.skills || []).join('; ')} 
                             onChange={e => setResumeData({...resumeData, skills: e.target.value.split(';').map((s: string) => s.trim())})} 
                             placeholder="Skill 1; Skill 2; Skill 3..."
                             className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-orange-500" 
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <input 
                                type="checkbox" 
                                id="showSkills" 
                                checked={resumeData.showSkills !== false} 
                                onChange={e => setResumeData({...resumeData, showSkills: e.target.checked})}
                                className="w-4 h-4 text-orange-600 rounded border-zinc-300 focus:ring-orange-500"
                            />
                            <label htmlFor="showSkills" className="text-[12px] text-zinc-600 font-medium cursor-pointer">Exibir seção de Competências no Currículo</label>
                        </div>
                        <p className="text-[11px] text-zinc-400">Separe as competências por ponto e vírgula.</p>
                    </div>

                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW (A4 Proportions) */}
            <div id="right-preview-pane" className="flex-1 h-full overflow-y-auto bg-zinc-200/50 p-4 sm:p-8 flex items-start justify-center print:p-0 print:block print:overflow-visible print:h-auto print:w-auto print:bg-white hide-scrollbar">
                
                {/* A4 Document Container */}
                <div 
                    className="bg-white w-full max-w-[800px] shadow-2xl print:shadow-none min-h-[1100px] mx-auto p-12 sm:p-16 text-zinc-800 [-webkit-print-color-adjust:exact] [print-color-adjust:exact] print:w-full print:max-w-none print:px-12 print:py-10"
                    style={{ fontFamily: fontMapping[selectedFont] }}
                >
                    
                    {/* Header */}
                    <header className="border-b-[1px] border-zinc-300 pb-4 mb-4 text-center">
                        <h1 className="text-[34px] font-extrabold text-zinc-900 tracking-[-0.01em] mb-1 uppercase">{resumeData.personal?.name || 'Seu Nome'}</h1>
                        <h2 className="text-[13px] text-zinc-500 font-semibold tracking-[0.2em] uppercase mb-1">{resumeData.personal?.title || 'Cargo Alvo'}</h2>
                        
                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 text-[12px] text-zinc-600 font-medium font-sans">
                            {resumeData.personal?.location && (
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {resumeData.personal.location}</span>
                            )}
                            {resumeData.personal?.email && (
                                <a href={`mailto:${resumeData.personal.email}`} className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors hover:underline"><Mail className="w-3.5 h-3.5" /> {resumeData.personal.email}</a>
                            )}
                            {resumeData.personal?.phone && (
                                <a href={`tel:${resumeData.personal.phone}`} className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors hover:underline"><Phone className="w-3.5 h-3.5" /> {resumeData.personal.phone}</a>
                            )}
                            {resumeData.personal?.linkedin && (
                                <a href={resumeData.personal.linkedin.startsWith('http') ? resumeData.personal.linkedin : `https://${resumeData.personal.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors hover:underline"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>
                            )}
                            {resumeData.personal?.portfolio && (
                                <a href={resumeData.personal.portfolio.startsWith('http') ? resumeData.personal.portfolio : `https://${resumeData.personal.portfolio}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors hover:underline">
                                    {resumeData.personal.portfolio.toLowerCase().includes('github.com') ? <Github className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />} {resumeData.personal.portfolio.toLowerCase().includes('github.com') ? 'GitHub' : 'Portfólio'}
                                </a>
                            )}
                            {(resumeData.personal?.customLinks || []).map((link: any, idx: number) => {
                                if (!link.url || !link.label) return null;
                                const lowerUrl = link.url.toLowerCase();
                                let Icon = ExternalLink;
                                if (lowerUrl.includes('linkedin.com')) Icon = Linkedin;
                                else if (lowerUrl.includes('github.com')) Icon = Github;
                                else Icon = Globe;
                                
                                return (
                                    <a key={idx} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors hover:underline">
                                        <Icon className="w-3.5 h-3.5" /> {link.label}
                                    </a>
                                )
                            })}
                        </div>
                    </header>

                    {/* Summary */}
                    {resumeData.summary && (
                        <section className="mb-4">
                            <p className="text-[13.5px] leading-[1.7] text-zinc-800 text-justify">
                                {resumeData.summary}
                            </p>
                        </section>
                    )}

                    {/* Work Experience */}
                    {resumeData.experience && resumeData.experience.length > 0 && (
                        <section className="mb-4">
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Experiência Profissional</h3>
                            <div className="space-y-4">
                                {resumeData.experience.map((exp: any, idx: number) => (
                                    <div key={idx} className="relative print:pb-2">
                                        <div className="flex justify-between items-baseline mb-0">
                                            <h4 className="text-[15px] font-extrabold text-zinc-900">{exp.position}</h4>
                                            <span className="text-[12px] text-zinc-500 font-bold uppercase font-sans tracking-wide">{exp.period}</span>
                                        </div>
                                        <div className="text-[14px] font-semibold text-zinc-700 mb-1.5 mt-0.5">
                                            {exp.companyUrl ? (
                                                <a href={exp.companyUrl.startsWith('http') ? exp.companyUrl : `https://${exp.companyUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 hover:underline inline-flex items-center gap-1.5">
                                                    {exp.company} <ExternalLink className="w-[11px] h-[11px]" />
                                                </a>
                                            ) : exp.company}
                                        </div>
                                        <ul className="list-none space-y-1.5 mt-2.5 text-[13.5px] text-zinc-800 leading-[1.65] text-justify">
                                            {(exp.description || []).map((bullet: string, bIdx: number) => (
                                                <li key={bIdx} className="relative pl-[14px] before:content-[''] before:absolute before:left-0 before:top-[0.65em] before:w-[3.5px] before:h-[3.5px] before:bg-zinc-400 before:rounded-full">{bullet}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {resumeData.education && resumeData.education.length > 0 && (
                        <section className="mb-4">
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Formação Acadêmica</h3>
                            <div className="space-y-3">
                                {resumeData.education.map((edu: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start print:break-inside-avoid">
                                        <div>
                                            <h4 className="text-[15px] font-bold text-zinc-900">{edu.degree}</h4>
                                            <div className="text-[14px] font-semibold text-zinc-700 mt-0.5">
                                                {edu.institution}
                                            </div>
                                        </div>
                                        <span className="text-[12px] text-zinc-500 font-bold uppercase font-sans tracking-wide whitespace-nowrap ml-4 mt-0.5">{edu.period}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                        <section className="mb-4">
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Projetos</h3>
                            <div className="space-y-3">
                                {resumeData.projects.map((proj: any, idx: number) => (
                                    <div key={idx} className="print:break-inside-avoid">
                                        <div className="flex gap-2 items-baseline mb-1">
                                            <h4 className="text-[15px] font-bold text-zinc-900">{proj.name}</h4>
                                            {proj.url && (
                                                <a href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 font-semibold font-sans hover:text-zinc-900 hover:underline flex items-center gap-1">
                                                    <ExternalLink className="w-[10px] h-[10px]" /> Link
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-[13.5px] text-zinc-800 leading-[1.65] text-justify">
                                            {proj.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications */}
                    {resumeData.certifications && resumeData.certifications.length > 0 && (
                        <section className="mb-4">
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Certificações</h3>
                            <div className="space-y-3">
                                {resumeData.certifications.map((cert: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start print:break-inside-avoid">
                                        <div>
                                            <div className="text-[14.5px] font-bold text-zinc-900 leading-snug">{cert.name} {cert.issuer && <span className="text-zinc-600 font-semibold ml-1">por {cert.issuer}</span>}</div>
                                            {cert.credentialId && (
                                                <div className="text-[12px] text-zinc-500 mt-0.5 font-sans">
                                                    Credencial: {cert.url ? (
                                                        <a href={cert.url.startsWith('http') ? cert.url : `https://${cert.url}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-zinc-900 hover:underline inline-flex items-center gap-1">
                                                            {cert.credentialId} <ExternalLink className="w-2.5 h-2.5" />
                                                        </a>
                                                    ) : (
                                                        <span className="font-mono">{cert.credentialId}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {cert.year && (
                                            <span className="text-[12px] text-zinc-500 font-bold uppercase font-sans tracking-wide whitespace-nowrap ml-4 mt-0.5">{cert.year}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Idiomas */}
                    {resumeData.languages && resumeData.languages.length > 0 && (
                        <section className="mb-4">
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Idiomas</h3>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                                {resumeData.languages.map((lang: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-baseline border-b border-zinc-100 pb-1">
                                        <span className="text-[14px] font-bold text-zinc-900">{lang.name}</span>
                                        <span className="text-[13.5px] text-zinc-600 font-semibold">{lang.level}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}



                    {/* Skills */}
                    {resumeData.showSkills !== false && resumeData.skills && resumeData.skills.length > 0 && (
                        <section>
                            <h3 className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-[0.15em] border-b-[1px] border-zinc-300 pb-1 mb-3 print:break-after-avoid">Competências</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {(resumeData.skills || []).map((skill: string, idx: number) => (
                                    <span key={idx} className="text-[13px] text-zinc-700 font-medium bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-md font-sans tracking-tight">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </main>
    )
}
