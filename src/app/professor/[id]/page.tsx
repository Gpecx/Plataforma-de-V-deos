import { notFound } from 'next/navigation'
import { ArrowLeft, Globe, Linkedin, Twitter, Youtube, Facebook } from 'lucide-react'
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
        <div className="theme-clean-white min-h-screen bg-white font-sans">
            {/* Header com botão voltar - Sem borda para visual Clean */}
            <div className="">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <Link href="/course">
                        <Button 
                            variant="ghost" 
                            className="rounded-none text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-10 px-4 text-sm font-bold uppercase tracking-wide"
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
                            <span className="inline-block bg-slate-100 text-[#1D5F31] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                                Instrutor PowerPlay
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {profile.full_name}
                            </h1>
                            <p className="text-lg font-bold text-slate-600 uppercase tracking-wide">
                                {profile.specialty}
                            </p>
                        </div>

                        {/* Stats Bar - Clean visual with background instead of borders */}
                        <div className="flex flex-wrap gap-6 md:gap-1 space-x-0 md:space-x-12 bg-slate-50/50 rounded-2xl p-6 md:p-8">
                            <div className="space-y-1 pr-8">
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
                        <div className="space-y-6 pt-4">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                Sobre
                            </h2>
                            <p className="text-base text-slate-600 leading-relaxed font-medium">
                                {profile.bio}
                            </p>
                        </div>

                        {/* Course Grid */}
                        {courses.length > 0 && (
                            <div className="space-y-8 pt-12">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                    Cursos ({stats.totalCourses})
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map(course => (
                                        <Link
                                            key={course.id}
                                            href={`/course/${course.id}`}
                                            className="group bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col border border-transparent hover:border-slate-100"
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-slate-100 rounded-t-xl">
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
                                                    <div className="absolute top-3 right-3 bg-slate-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded">
                                                        {course.tag}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 flex-grow flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {course.category || ' curso '}
                                                    </p>
                                                    <h3 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tighter line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                </div>
                                                <div className="mt-5 pt-4 flex items-center justify-between">
                                                    <span className="text-base font-black text-slate-900">
                                                        R$ {Number(course.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1D5F31] transition-colors">
                                                        <ArrowLeft className="rotate-180 text-slate-600 group-hover:text-white transition-colors" size={16} />
                                                    </div>
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
                        <div className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] p-6 space-y-8">
                            {/* Avatar */}
                            <div className="w-full aspect-square bg-slate-100 overflow-hidden rounded-2xl">
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

                            {/* Social Links - Udemy Style (Green) */}
                            {Object.values(profile.social).some(Boolean) && (
                                <div className="pt-2 flex flex-wrap justify-center gap-3">
                                    {profile.social.website && (
                                        <a 
                                            href={profile.social.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all duration-300"
                                            title="Site"
                                        >
                                            <Globe size={20} />
                                        </a>
                                    )}
                                    {profile.social.linkedin && (
                                        <a 
                                            href={profile.social.linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all duration-300"
                                            title="LinkedIn"
                                        >
                                            <Linkedin size={20} />
                                        </a>
                                    )}
                                    {profile.social.twitter && (
                                        <a 
                                            href={profile.social.twitter} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all duration-300"
                                            title="Twitter"
                                        >
                                            <Twitter size={20} />
                                        </a>
                                    )}
                                    {profile.social.youtube && (
                                        <a 
                                            href={profile.social.youtube} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all duration-300"
                                            title="YouTube"
                                        >
                                            <Youtube size={20} />
                                        </a>
                                    )}
                                    {profile.social.facebook && (
                                        <a 
                                            href={profile.social.facebook} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all duration-300"
                                            title="Facebook"
                                        >
                                            <Facebook size={20} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}