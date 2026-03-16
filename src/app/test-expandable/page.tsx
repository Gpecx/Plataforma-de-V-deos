"use client"

import { ExpandableCard } from '@/components/ui/ExpandableCard'

const MOCK_COURSES = [
    {
        id: "1",
        thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
        title: "Engenharia de Precisão",
        description: "Domine as técnicas mais avançadas de metrologia e calibração de sistemas industriais de alta performance.",
        accent: "ALTA PERFORMANCE"
    },
    {
        id: "2",
        thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
        title: "Sistemas de Automação",
        description: "Aprenda a projetar e implementar sistemas de controle lógico programável para plantas industriais complexas.",
        accent: "TECNOLOGIA"
    },
    {
        id: "3",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        title: "Estratégia Industrial",
        description: "Otimização de processos e gestão de recursos para máxima eficiência produtiva no campo de batalha moderno.",
        accent: "ESTRATEGIA"
    }
]

export default function TestPage() {
    return (
        <main className="min-h-screen bg-[#0a140e] p-12">
            <h1 className="text-4xl font-black text-white mb-12 border-l-4 border-[#00C402] pl-6 uppercase tracking-tighter">
                Expandable Card <span className="text-[#00C402]">Demo</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {MOCK_COURSES.map((course) => (
                    <ExpandableCard 
                        key={course.id}
                        {...course}
                    />
                ))}
            </div>

            {/* Espaçador para testar scroll locking */}
            <div className="h-[200vh] mt-24 border-t border-white/10 flex items-center justify-center">
                <p className="text-white/20 uppercase font-black tracking-widest">Role para baixo (Teste de Bloqueio de Scroll)</p>
            </div>
        </main>
    )
}
