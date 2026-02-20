import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
import { CheckCircle2, ChevronDown, PlayCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'

// Simple client component for the accordion to keep things interactive
// We'll define it inside the same file or as a sub-component for now
// to keep it simple as per instructions.

export default async function CourseLandingPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Busca detalhes do curso
    const { data: curso, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !curso) {
        return notFound()
    }

    // 2. Módulos de exemplo (já que não temos a tabela ainda)
    const modulosExemplo = [
        {
            id: 1,
            title: "Módulo 1: Fundamentos e Setup",
            aulas: ["Introdução ao curso", "Configurando o ambiente", "Conceitos fundamentais"]
        },
        {
            id: 2,
            title: "Módulo 2: Mergulho Profundo",
            aulas: ["Arquitetura avançada", "Padrões de projeto", "Trabalhando com dados"]
        },
        {
            id: 3,
            title: "Módulo 3: Projeto Prático e Deploy",
            aulas: ["Construindo a aplicação", "Testes automatizados", "Publicação e monitoramento"]
        }
    ]

    return (
        <div className="min-h-screen bg-[#061629] text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-8 md:px-20 border-b border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Content */}
                    <div className="space-y-6">
                        <div className="inline-block px-3 py-1 bg-[#00C402]/10 border border-[#00C402]/20 rounded-full text-[#00C402] text-xs font-bold tracking-widest uppercase">
                            Acesso Vitalício
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none uppercase">
                            {curso.title}
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-xl">
                            {curso.description || "Domine as tecnologias mais requisitadas do mercado com uma metodologia prática e direta ao ponto."}
                        </p>

                        <div className="pt-4">
                            <form action={async () => {
                                'use server'
                                const supabase = await createClient()
                                const { data: { user } } = await supabase.auth.getUser()

                                if (!user) {
                                    redirect('/login')
                                }

                                // Se já estiver logado, redireciona para o checkout ou dashboard
                                // Para este MVP, vamos redirecionar para o dashboard de estudante
                                redirect('/dashboard-student')
                            }}>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-[#00C402] text-black font-black text-xl uppercase italic rounded-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,196,2,0.3)]"
                                >
                                    Comprar Agora
                                </button>
                            </form>
                            <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-[#00C402]" />
                                Garantia de 7 dias ou seu dinheiro de volta
                            </p>
                        </div>
                    </div>

                    {/* Right: Video Trailer */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#00C402] to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                            <MuxPlayer
                                playbackId={curso.mux_playback_id || "DS00S01vK02M66B9P2f94902FhWcuxXvV"} // ID de teste se vazio
                                metadataVideoTitle={curso.title}
                                className="w-full h-full"
                                primaryColor="#00C402"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Curriculum Section */}
            <section className="py-24 px-8 md:px-20 max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
                        O que você vai <span className="text-[#00C402]">aprender</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Uma grade curricular pensada para te levar do zero ao nível profissional no menor tempo possível.
                    </p>
                </div>

                {/* Accordion List */}
                <div className="space-y-4">
                    {modulosExemplo.map((modulo) => (
                        <details key={modulo.id} className="group bg-[#0a1f3a] border border-white/5 rounded-xl overflow-hidden transition-all">
                            <summary className="list-none p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-[#00C402]/10 flex items-center justify-center text-[#00C402] font-bold">
                                        {modulo.id}
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl">{modulo.title}</h3>
                                </div>
                                <ChevronDown className="text-gray-500 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-6 pb-6 pt-2 space-y-3">
                                {modulo.aulas.map((aula, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors py-2 border-b border-white/5 last:border-0">
                                        <PlayCircle size={16} className="text-[#00C402]" />
                                        <span className="text-sm font-medium">{aula}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>

                {/* Final CTA */}
                <div className="mt-20 p-12 bg-gradient-to-b from-[#0a1f3a] to-transparent rounded-3xl border border-white/5 text-center">
                    <h3 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter">Pronto para começar sua transformação?</h3>
                    <form action={async () => {
                        'use server'
                        const supabase = await createClient()
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) redirect('/login')
                        redirect('/dashboard-student')
                    }}>
                        <button
                            type="submit"
                            className="px-12 py-5 bg-[#00C402] text-black font-black text-2xl uppercase italic rounded-full hover:scale-105 transition-all hover:bg-white"
                        >
                            Quero me inscrever agora
                        </button>
                    </form>
                </div>
            </section>
        </div>
    )
}
