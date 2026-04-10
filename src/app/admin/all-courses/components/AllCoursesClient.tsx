"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, User, Tag, BookOpen, X } from 'lucide-react'
import CourseDeleteButton from '@/components/CourseDeleteButton'

interface Course {
    id: string
    title: string
    subtitle?: string
    image_url?: string
    teacherName?: string
    teacher_id?: string
    category?: string
    status: string
    price?: number
}

interface Teacher {
    id: string
    full_name?: string
    name?: string
}

interface AllCoursesClientProps {
    courses: Course[]
    teachers: Teacher[]
}

export default function AllCoursesClient({ courses, teachers }: AllCoursesClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('')
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APROVADO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-none border border-green-200">APROVADO</span>
            case 'PENDENTE':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-none border border-amber-200">PENDENTE</span>
            case 'REJEITADO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-none border border-red-200">REJEITADO</span>
            case 'SOLICITADO_EXCLUSAO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1 rounded-none border border-slate-300">EXCLUSÃO SOLICITADA</span>
            default:
                return <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{status}</span>
        }
    }

    const filteredCourses = useMemo(() => {
        let result = courses

        if (selectedTeacher) {
            result = result.filter(course => course.teacher_id === selectedTeacher)
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(course => 
                course.title?.toLowerCase().includes(term) ||
                course.subtitle?.toLowerCase().includes(term) ||
                course.category?.toLowerCase().includes(term) ||
                course.teacherName?.toLowerCase().includes(term)
            )
        }

        return result
    }, [courses, searchTerm, selectedTeacher])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedTeacher('')
    }

    const hasFilters = searchTerm || selectedTeacher

    const filteredTeachers = useMemo(() => {
        if (!searchTerm) return teachers
        const term = searchTerm.toLowerCase()
        return teachers.filter(t => 
            t.full_name?.toLowerCase().includes(term) ||
            t.name?.toLowerCase().includes(term)
        )
    }, [teachers, searchTerm])

    return (
        <div className="space-y-8 min-h-screen font-montserrat admin-page">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter">
                        CATÁLOGO GLOBAL
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[4px] mt-2">
                        Auditoria completa de todos os cursos
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
                {/* Busca por curso */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-[#1D5F31] focus:ring-2 focus:ring-green-700/20 focus:outline-none transition-colors"
                    />
                </div>

                {/* Filtro por Professor */}
                <div className="relative min-w-[280px]">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar por professor..."
                            value={selectedTeacher ? teachers.find(t => t.id === selectedTeacher)?.full_name || teachers.find(t => t.id === selectedTeacher)?.name || '' : ''}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setShowTeacherDropdown(true)
                            }}
                            onFocus={() => setShowTeacherDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                            className="w-full pl-12 pr-10 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-[#1D5F31] focus:ring-2 focus:ring-green-700/20 focus:outline-none transition-colors cursor-pointer"
                            readOnly
                        />
                        {selectedTeacher && (
                            <button
                                onClick={() => {
                                    setSelectedTeacher('')
                                    setSearchTerm('')
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown de Professores */}
                    {showTeacherDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg max-h-60 overflow-y-auto shadow-lg">
                            {teachers.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500 text-center">
                                    Nenhum professor encontrado
                                </div>
                            ) : (
                                teachers.map(teacher => (
                                    <button
                                        key={teacher.id}
                                        onClick={() => {
                                            setSelectedTeacher(teacher.id)
                                            setSearchTerm('')
                                            setShowTeacherDropdown(false)
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1D5F31]/10 transition-colors ${
                                            selectedTeacher === teacher.id ? 'bg-[#1D5F31]/10 text-[#1D5F31]' : 'text-slate-700'
                                        }`}
                                    >
                                        {teacher.full_name || teacher.name || 'Sem nome'}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Botão Limpar Filtros */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                    >
                        <X size={14} />
                        Limpar Filtros
                    </button>
                )}
            </div>

            {/* Contador de resultados */}
            {hasFilters && (
                <div className="text-sm text-slate-500">
                    <span className="font-bold">{filteredCourses.length}</span> curso(s) encontrado(s)
                </div>
            )}

            {/* Tabela de Cursos */}
            <div className="bg-white border-2 border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Curso</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Professor</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Status</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right">Preço</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <BookOpen size={48} className="text-slate-300" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {hasFilters 
                                                    ? 'Nenhum curso encontrado para este instrutor' 
                                                    : 'Nenhum curso encontrado'
                                                }
                                            </p>
                                            {hasFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-[#1D5F31] text-xs font-bold uppercase tracking-wider hover:underline"
                                                >
                                                    Limpar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map((course) => (
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
                                                    <h3 className="font-bold uppercase text-sm text-slate-900 leading-tight max-w-[300px] truncate">
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
                                                    {course.teacherName || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1.5 rounded-none border border-slate-200">
                                                {course.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {getStatusBadge(course.status)}
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="text-sm font-bold text-slate-900">
                                                R$ {Number(course.price || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <CourseDeleteButton courseId={String(course.id)} courseTitle={course.title} />
                                                <Link
                                                    href={`/admin/classroom/${String(course.id)}`}
                                                    className="inline-flex items-center gap-2 px-6 py-3 text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg active:scale-95"
                                                    style={{ backgroundColor: '#1D5F31' }}
                                                >
                                                    Acessar Sala
                                                </Link>
                                            </div>
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
