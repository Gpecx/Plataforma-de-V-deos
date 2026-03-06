"use client"

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { useAuth } from '@/context/AuthProvider'
import { useRouter } from 'next/navigation'
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
    const { user, role, loading: authLoading } = useAuth()
    const router = useRouter()

    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // 1. Busca os cursos do banco
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        // Bloqueia acesso se não for professor ou admin
        if (!authLoading && user && role !== 'teacher' && role !== 'admin') {
            router.push('/dashboard-student')
            return
        }

        async function fetchCourses() {
            if (!user) return;

            try {
                const q = query(
                    collection(db, 'courses'),
                    where('teacher_id', '==', user.uid)
                )
                const querySnapshot = await getDocs(q)
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                // Ordenação manual no lado do cliente para evitar erro de índice composto faltando
                data.sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });

                setCourses(data)
            } catch (error) {
                console.error("Error loading courses:", error)
            } finally {
                setLoading(false)
            }
        }

        if (user && (role === 'teacher' || role === 'admin')) {
            fetchCourses()
        }

    }, [user, authLoading, role, router])

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

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-slate-800" size={48} />
            </div>
        )
    }

    if (!user || (role !== 'teacher' && role !== 'admin')) return null;

    return (
        <div className="p-8 md:p-12 space-y-12 bg-[#F4F7F9] min-h-screen text-slate-800 border-t border-slate-100 font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        Meus <span className="text-[#00C402]">Cursos</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Gerencie e acompanhe o desempenho de suas aulas.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <Button className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-8 h-14 rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200">
                        <Plus size={18} className="mr-2" />
                        Lançar Novo Curso
                    </Button>
                </Link>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Buscar por nome do curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border-slate-100 pl-12 h-14 rounded-2xl focus:border-[#00C402] focus:ring-[#00C402] text-sm font-medium"
                    />
                </div>
                <div className="bg-white border border-slate-100 text-slate-400 h-14 px-8 rounded-2xl flex items-center gap-3 shadow-sm">
                    <Filter size={16} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{filteredCourses.length} Encontrados</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredCourses.map((curso) => (
                    <div key={curso.id} className="bg-white border border-slate-100 rounded-[40px] overflow-hidden group shadow-sm hover:border-[#00C402]/30 transition-all flex flex-col">
                        <div className="relative h-56 bg-white overflow-hidden">
                            <img
                                src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                alt={curso.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>

                        <div className="p-8 flex-grow flex flex-col">
                            <h3 className="text-2xl font-black tracking-tighter text-slate-800 mb-2 truncate">{curso.title}</h3>
                            <div className="flex justify-between items-center mb-8">
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
                                    <Button className="w-full bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-800 border border-slate-100 font-black uppercase tracking-widest py-5 h-auto rounded-2xl transition-all duration-300">
                                        <Edit size={16} className="mr-2" /> Editar
                                    </Button>
                                </Link>

                                <Button
                                    variant="outline"
                                    onClick={() => handleDelete(curso.id)}
                                    className="border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 p-4 rounded-2xl transition-colors"
                                >
                                    <Trash2 size={20} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}