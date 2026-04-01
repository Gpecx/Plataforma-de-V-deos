import Link from 'next/link'
import { getAllCourses } from '@/app/actions/admin'
import { Search, User, Tag, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AllCoursesPage() {
    const courses = await getAllCourses()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APROVADO':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-none border border-green-200">APROVADO</span>
            case 'PENDENTE':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-none border border-amber-200">PENDENTE</span>
            case 'REJEITADO':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-none border border-red-200">REJEITADO</span>
            case 'SOLICITADO_EXCLUSAO':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1 rounded-none border border-slate-300">EXCLUSÃO SOLICITADA</span>
            default:
                return <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{status}</span>
        }
    }

    return (
        <div className="p-8 lg:p-12 space-y-8 bg-slate-50 min-h-screen font-exo">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1D5F31]">
                        Catálogo Global
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-600 mt-2">
                        Auditoria completa de todos os cursos
                    </p>
                </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider">Curso</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider">Professor</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider">Categoria</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider text-right">Preço</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <BookOpen size={48} className="text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Nenhum curso encontrado
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course: any) => (
                                    <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-none overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {course.image_url ? (
                                                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                            <Tag size={20} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-black uppercase text-sm text-slate-900 leading-tight max-w-[300px] truncate">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1 truncate max-w-[300px]">
                                                        {course.subtitle || 'Sem subtítulo'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                    {course.teacherName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1.5 rounded-none border border-slate-200">
                                                {course.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {getStatusBadge(course.status)}
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="text-sm font-black text-slate-900">
                                                R$ {Number(course.price || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Link
                                                href={`/admin/classroom/${String(course.id)}`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D5F31] text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all rounded-none active:scale-95"
                                            >
                                                Acessar Sala
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
