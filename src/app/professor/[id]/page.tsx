import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getInstructorProfile, getInstructorStats, getInstructorCourses } from '@/app/actions/instructor'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ProfessorProfilePage({ params }: PageProps) {
    const { id } = await params
    
    const [profile, stats] = await Promise.all([
        getInstructorProfile(id),
        getInstructorStats(id)
    ])

    if (!profile) {
        notFound()
    }

    const { courses, lastId, hasMore } = await getInstructorCourses(id, 10)

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header com botão voltar */}
            <div className="border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <Link href="/course">
                        <Button 
                            variant="ghost" 
                            className="rounded-none text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-10 px-4 text-sm font-bold uppercase tracking-wide"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Voltar ao Catálogo
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="space-y-8">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <span className="text-[#1D5F31] text-xs font-bold uppercase tracking-widest block">
                                Instrutor PowerPlay
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {profile.full_name}
                            </h1>
                            <p className="text-lg font-bold text-slate-600 uppercase tracking-tight">
                                {profile.specialty}
                            </p>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex flex-wrap gap-6 md:gap-12 border-y border-slate-200 py-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alunos</p>
                                <p className="text-xl font-black text-slate-900 tracking-tighter">
                                    {stats.totalStudents.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cursos</p>
                                <p className="text-xl font-black text-slate-900 tracking-tighter">
                                    {stats.totalCourses}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avaliação</p>
                                <p className="text-xl font-black text-slate-900 tracking-tighter">
                                    {stats.averageRating.toFixed(1)}
                                </p>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-4 pt-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter border-l-4 border-slate-900 pl-4">
                                Sobre
                            </h2>
                            <p className="text-base text-slate-600 leading-relaxed font-medium">
                                {profile.bio}
                            </p>
                        </div>

                        {/* Course Grid */}
                        {courses.length > 0 && (
                            <div className="space-y-6 pt-8">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter border-b border-slate-200 pb-4">
                                    Cursos ({stats.totalCourses})
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map(course => (
                                        <Link
                                            key={course.id}
                                            href={`/course/${course.id}`}
                                            className="group bg-white border border-slate-200 overflow-hidden hover:border-slate-900 transition-all duration-300 flex flex-col"
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-slate-100 border-b border-slate-200">
                                                {course.image_url ? (
                                                    <img
                                                        src={course.image_url}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <span className="text-xs font-bold uppercase"> Sem Imagem </span>
                                                    </div>
                                                )}
                                                {course.tag && (
                                                    <div className="absolute top-0 right-0 bg-slate-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                                        {course.tag}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex-grow flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {course.category || ' curso '}
                                                    </p>
                                                    <h3 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tighter line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-sm font-black text-slate-900">
                                                        R$ {Number(course.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </span>
                                                    <ArrowLeft className="rotate-180 text-slate-400 group-hover:text-slate-900 transition-colors" size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:sticky lg:top-8 h-fit">
                        <div className="bg-white border border-slate-200 p-6 space-y-6">
                            {/* Avatar */}
                            <div className="w-full aspect-square bg-slate-100 overflow-hidden border border-slate-200">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="text-xs font-bold uppercase">Sem Foto</span>
                                    </div>
                                )}
                            </div>

                            {/* Social Links */}
                            {Object.values(profile.social).some(Boolean) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Links
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.social.website && (
                                            <a 
                                                href={profile.social.website} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-white border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors"
                                            >
                                                Site
                                            </a>
                                        )}
                                        {profile.social.linkedin && (
                                            <a 
                                                href={profile.social.linkedin} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-white border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:border-blue-700 transition-colors"
                                            >
                                                LinkedIn
                                            </a>
                                        )}
                                        {profile.social.twitter && (
                                            <a 
                                                href={profile.social.twitter} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-white border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-sky-500 hover:border-sky-500 transition-colors"
                                            >
                                                Twitter
                                            </a>
                                        )}
                                        {profile.social.youtube && (
                                            <a 
                                                href={profile.social.youtube} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-white border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 hover:border-red-600 transition-colors"
                                            >
                                                YouTube
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}