"use client"

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ConfirmModal } from '@/components/ConfirmModal'

interface LiveSchedule {
    id: string;
    title: string;
    description: string;
    courseId: string;
    date: string;
}

export default function LiveStreamPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    const [scheduledLives, setScheduledLives] = useState<LiveSchedule[]>([
        {
            id: 'mock-id',
            title: 'Aula de Revisão - Módulo 1',
            description: '',
            courseId: 'Eletricidade Básica',
            date: '2026-08-15T19:00'
        }
    ])
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        date: ''
    })

    const [errors, setErrors] = useState<{ title?: string, date?: string }>({})
    const [editingLive, setEditingLive] = useState<LiveSchedule | null>(null)
    const [liveToCancel, setLiveToCancel] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const coursesSnapshot = await getDocs(query(collection(db, 'courses'), where('teacher_id', '==', user.uid)))
                    const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    setCourses(coursesData)
                } catch (error) {
                    console.error("Erro ao carregar cursos:", error)
                }
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        
        const newErrors: { title?: string, date?: string } = {}
        if (!formData.title) newErrors.title = 'O título da live é obrigatório.'
        if (!formData.date) newErrors.date = 'A data e hora são obrigatórias.'
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        
        setErrors({})

        const courseName = courses.find(c => c.id === formData.courseId)?.title || formData.courseId

        setScheduledLives(prev => [...prev, { ...formData, id: Date.now().toString(), courseId: courseName }])
        setFormData({ title: '', description: '', courseId: '', date: '' })
    }

    const formatScheduleDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day}/${month}/${year} às ${hours}:${minutes}`
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-transparent">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="pb-16 md:pb-24 bg-transparent min-h-screen font-montserrat animate-in fade-in duration-500">
            <header className="flex flex-col justify-center pt-8 px-4 md:px-8 mb-12 gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none text-slate-900">
                    Live <span className="text-slate-900">Stream</span>
                </h1>
                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-[3px]">
                    Transmita ao vivo para seus alunos
                </p>
            </header>

            <div className="px-4 md:px-8 max-w-3xl">
                <div className="bg-white rounded-lg border border-black/20 p-8 shadow-sm">
                    <form className="space-y-6" onSubmit={handleAdd}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Título da Live</label>
                            <Input 
                                placeholder="Ex: Aula de Revisão - Módulo 1"
                                value={formData.title}
                                onChange={e => { setFormData({ ...formData, title: e.target.value }); setErrors({ ...errors, title: undefined }) }}
                                className={`h-14 rounded-md bg-white hover:bg-slate-50 focus:bg-white px-5 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none placeholder:text-slate-500 placeholder:font-medium ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`}
                            />
                            {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1">{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Descrição</label>
                            <textarea 
                                placeholder="Detalhes sobre o conteúdo da transmissão..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full min-h-[120px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 focus:bg-white px-5 py-4 text-sm font-bold shadow-sm transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 focus:outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:outline-none placeholder:text-slate-500 placeholder:font-medium resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Curso Relacionado</label>
                            <select 
                                value={formData.courseId}
                                onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                className="w-full h-14 rounded-md border border-slate-200 bg-white hover:bg-slate-50 focus:bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 focus:outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                <option value="" disabled>Selecione um curso...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Data e Hora</label>
                            <div className="relative">
                                <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 ${errors.date ? 'text-red-500' : 'text-slate-500'}`} size={20} />
                                <Input 
                                    type="datetime-local"
                                    value={formData.date}
                                    onChange={e => { setFormData({ ...formData, date: e.target.value }); setErrors({ ...errors, date: undefined }) }}
                                    className={`h-14 rounded-md bg-white hover:bg-slate-50 focus:bg-white pl-14 pr-5 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none placeholder:text-slate-500 placeholder:font-medium ${errors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`}
                                />
                            </div>
                            {errors.date && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1">{errors.date}</p>}
                        </div>

                        <div className="pt-6 border-t border-black/10">
                            <Button type="submit" className="w-full bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-16 flex items-center justify-center gap-2 rounded-lg hover:opacity-90 active:scale-95 transition-all">
                                <Play size={18} strokeWidth={3} /> Agendar Live
                            </Button>
                        </div>
                    </form>
                </div>

                {/* LIVES AGENDADAS */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold tracking-tighter uppercase text-slate-900 mb-6">
                        Lives <span className="text-[#1D5F31]">Agendadas</span>
                    </h2>
                    <div className="space-y-4">
                        {scheduledLives.map(live => (
                            <div key={live.id} className="bg-white rounded-lg border border-black/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-black/40 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">Agendada</span>
                                        <h3 className="font-bold text-slate-900">{live.title}</h3>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">Curso: {live.courseId || 'Não especificado'}</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-2">
                                        <Calendar size={14} />
                                        {formatScheduleDate(live.date)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button onClick={() => setEditingLive(live)} variant="outline" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-12 px-6 rounded-lg hover:bg-slate-50">
                                        Editar
                                    </Button>
                                    <Button onClick={() => setLiveToCancel(live.id)} variant="outline" className="border-red-200 text-red-600 font-bold uppercase text-[10px] tracking-widest h-12 px-6 rounded-lg hover:bg-red-50 hover:border-red-300">
                                        Cancelar
                                    </Button>
                                    <Link href={`/dashboard-teacher/live/${live.id}` as any}>
                                        <Button className="bg-[#1D5F31] text-white font-bold uppercase text-[10px] tracking-widest h-12 px-8 rounded-lg hover:bg-[#1D5F31]/90 shadow-lg shadow-[#1D5F31]/20">
                                            <Play size={14} className="mr-2" /> Iniciar
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {scheduledLives.length === 0 && (
                            <div className="text-sm font-medium text-slate-500 italic py-4">Nenhuma live agendada no momento.</div>
                        )}
                    </div>
                </div>

                {/* HISTÓRICO DE LIVES */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold tracking-tighter uppercase text-slate-900 mb-6">
                        Histórico de <span className="text-slate-600">Lives</span>
                    </h2>
                    <div className="space-y-4 bg-slate-50 rounded-lg border border-slate-200 p-6 shadow-sm">
                        <div className="text-sm font-medium text-slate-500 italic py-2">
                            Nenhuma live realizada ainda.
                        </div>
                    </div>
                </div>

            </div>

            {/* EDIT MODAL */}
            {editingLive && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300 p-4" onClick={() => setEditingLive(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-black/5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Editar Live</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Título</label>
                                <Input 
                                    value={editingLive.title}
                                    onChange={e => setEditingLive({...editingLive, title: e.target.value})}
                                    className="h-12 border-slate-200 focus-visible:ring-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Descrição</label>
                                <textarea 
                                    value={editingLive.description}
                                    onChange={e => setEditingLive({...editingLive, description: e.target.value})}
                                    className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Curso Relacionado</label>
                                <select 
                                    value={editingLive.courseId}
                                    onChange={e => setEditingLive({...editingLive, courseId: e.target.value})}
                                    className="w-full h-12 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="" disabled>Selecione um curso...</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Data e Hora</label>
                                <Input 
                                    type="datetime-local"
                                    value={editingLive.date}
                                    onChange={e => setEditingLive({...editingLive, date: e.target.value})}
                                    className="h-12 border-slate-200 focus-visible:ring-slate-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-6 border-t border-slate-100 bg-slate-50">
                            <Button onClick={() => {
                                const courseName = courses.find(c => c.id === editingLive.courseId)?.title || editingLive.courseId;
                                setScheduledLives(prev => prev.map(l => l.id === editingLive.id ? {...editingLive, courseId: courseName} : l));
                                setEditingLive(null);
                            }} className="flex-1 bg-[#1D5F31] text-white font-bold uppercase text-[10px] tracking-widest h-12 rounded-lg hover:bg-[#1D5F31]/90 transition-all">
                                Salvar Alterações
                            </Button>
                            <Button onClick={() => setEditingLive(null)} variant="outline" className="flex-1 border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-12 rounded-lg hover:bg-slate-100">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM CANCEL MODAL */}
            <ConfirmModal
                open={liveToCancel !== null}
                onClose={() => setLiveToCancel(null)}
                onConfirm={() => {
                    if (liveToCancel) {
                        setScheduledLives(prev => prev.filter(l => l.id !== liveToCancel));
                        setLiveToCancel(null);
                    }
                }}
                title="Cancelar Live"
                description="Tem certeza que deseja cancelar esta live agendada? Esta ação não pode ser desfeita."
                confirmLabel="Cancelar Live"
                cancelLabel="Manter"
                variant="danger"
            />
        </div>
    )
}
