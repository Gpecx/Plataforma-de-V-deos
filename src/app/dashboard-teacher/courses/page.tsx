"use client"

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    Edit,
    Users,
    Star,
    BookOpen,
    Trash2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Importamos a action que você acabou de criar no actions.ts
import { deleteCourseAction } from './actions'

export default function TeacherCoursesPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const coursesRef = collection(db, 'courses');
                    const querySnapshot = await getDocs(query(coursesRef, where('teacher_id', '==', user.uid)));
                    const data = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setCourses(data);
                } catch (error) {
                    console.error("Erro ao carregar cursos:", error);
                }
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // --- AQUI ENTRA O CÓDIGO QUE VOCÊ ESTAVA NA DÚVIDA ---
    const handleDelete = async (courseId: string) => {
        if (!confirm("Tem certeza que deseja excluir este curso permanentemente?")) return;

        const result = await deleteCourseAction(courseId);

        if (result.success) {
            // Remove o curso da lista na tela na mesma hora
            setCourses(prev => prev.filter(c => c.id !== courseId));
            alert("🚀 Curso removido com sucesso!");
        } else {
            alert("Erro ao remover: " + result.error);
        }
    };
    // ---------------------------------------------------

    const filteredCourses = courses.filter(curso =>
        curso.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-transparent">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="pb-16 md:pb-24 bg-transparent min-h-screen text-white font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 px-4 md:px-8 mb-12 gap-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        Meus <span className="text-[#1D5F31]">Cursos</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Gerencie e acompanhe o desempenho de suas aulas.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <Button className="bg-[#1D5F31] text-white font-black uppercase text-[10px] tracking-widest px-8 h-14 rounded-none hover:bg-[#28b828] shadow-none border border-[#1D5F31]/20">
                        <Plus size={18} className="mr-2" />
                        Lançar Novo Curso
                    </Button>
                </Link>
            </header>

            <div className="px-4 md:px-8 mb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Buscar por nome do curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#061629] border-[#1D5F31] pl-12 h-14 rounded-none focus:border-[#1D5F31] focus:ring-[#1D5F31] text-sm font-medium text-white"
                        />
                    </div>
                    <div className="bg-[#061629] border border-[#1D5F31] text-slate-400 h-14 px-8 rounded-none flex items-center gap-3 shadow-none">
                        <Filter size={16} className="text-[#1D5F31]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{filteredCourses.length} Encontrados</span>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {filteredCourses.map((curso) => (
                        <div key={curso.id} className="bg-[#061629] border border-[#1D5F31] rounded-none overflow-hidden group shadow-sm hover:border-[#1D5F31]/30 transition-all flex flex-col">
                            <div className="relative h-32 bg-[#061629] overflow-hidden">
                                <img
                                    src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                    alt={curso.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            <div className="p-3 flex-grow flex flex-col">
                                <h3 className="text-base font-black tracking-tighter text-white mb-2 truncate">{curso.title}</h3>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{curso.category || 'Sem categoria'}</p>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[7px] font-black uppercase text-slate-400 tracking-[1px]">Valor</span>
                                        <span className="text-[#1D5F31] font-black text-sm tracking-tighter leading-none">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(curso.price || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-4">
                                    <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="flex-grow">
                                        <Button className="w-full bg-[#061629] hover:bg-[#1D5F31] text-white border border-[#1D5F31] font-black uppercase tracking-widest py-2 h-auto rounded-none transition-all duration-300 text-[10px]">
                                            <Edit size={14} className="mr-2" /> Editar
                                        </Button>
                                    </Link>

                                    <Button
                                        variant="outline"
                                        onClick={() => handleDelete(curso.id)}
                                        className="border-[#1D5F31] text-slate-500 hover:text-red-500 hover:border-red-900 hover:bg-red-950/30 p-3 rounded-none transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}