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
            <div className="flex h-screen items-center justify-center bg-[#0d2b17]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    return (
        <div className="pb-16 md:pb-24 bg-[#0d2b17] min-h-screen text-white font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-0 px-4 md:px-8 mb-12 gap-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        Meus <span className="text-[#00C402]">Cursos</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Gerencie e acompanhe o desempenho de suas aulas.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <Button className="bg-[#00C402] text-white font-black uppercase text-[10px] tracking-widest px-8 h-14 rounded-2xl hover:bg-[#28b828] shadow-lg shadow-[#00C402]/20">
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
                            className="bg-[#0f1f14] border-[#1e4d2b] pl-12 h-14 rounded-2xl focus:border-[#00C402] focus:ring-[#00C402] text-sm font-medium text-white"
                        />
                    </div>
                    <div className="bg-[#0f1f14] border border-[#1e4d2b] text-slate-400 h-14 px-8 rounded-2xl flex items-center gap-3 shadow-sm">
                        <Filter size={16} className="text-[#00C402]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{filteredCourses.length} Encontrados</span>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredCourses.map((curso) => (
                        <div key={curso.id} className="bg-[#0f1f14] border border-[#1e4d2b] rounded-none overflow-hidden group shadow-sm hover:border-[#00C402]/30 transition-all flex flex-col">
                            <div className="relative h-48 bg-[#0d2b17] overflow-hidden">
                                <img
                                    src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                    alt={curso.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="text-xl font-black tracking-tighter text-white mb-2 truncate">{curso.title}</h3>
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{curso.category || 'Sem categoria'}</p>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[7px] font-black uppercase text-slate-400 tracking-[1px]">Valor</span>
                                        <span className="text-[#00C402] font-black text-lg tracking-tighter leading-none">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(curso.price || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-4">
                                    <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="flex-grow">
                                        <Button className="w-full bg-[#0d2b17] hover:bg-[#1e4d2b] text-white border border-[#1e4d2b] font-black uppercase tracking-widest py-3 h-auto rounded-none transition-all duration-300">
                                            <Edit size={16} className="mr-2" /> Editar
                                        </Button>
                                    </Link>

                                    <Button
                                        variant="outline"
                                        onClick={() => handleDelete(curso.id)}
                                        className="border-[#1e4d2b] text-slate-500 hover:text-red-500 hover:border-red-900 hover:bg-red-950/30 p-3 rounded-none transition-colors"
                                    >
                                        <Trash2 size={20} />
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