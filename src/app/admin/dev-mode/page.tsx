import { Monitor, Eye, ExternalLink, AlertTriangle } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

async function getFirstCourseId(): Promise<string | null> {
  try {
    const snapshot = await adminDb
      .collection('courses')
      .where('status', '==', 'APROVADO')
      .limit(1)
      .get()

    if (snapshot.empty) return null
    return snapshot.docs[0].id
  } catch {
    return null
  }
}

export default async function DevModePage() {
  const courseId = await getFirstCourseId()

  const links = [
    {
      title: 'Dashboard do Aluno',
      href: '/dashboard-student',
      description: 'Visualizar a plataforma como um aluno',
    },
    {
      title: 'Painel do Professor',
      href: '/dashboard-teacher/courses',
      description: 'Visualizar o painel de professor',
    },
    {
      title: 'Sala de Aula',
      href: courseId ? `/classroom/${courseId}` : null,
      description: courseId ? 'Acessar sala de aula exemplo' : 'Nenhum curso disponível para inspecionar',
      disabled: !courseId,
    },
  ]

  return (
    <div className="space-y-12 animate-in fadeIn duration-700 font-montserrat p-8 md:p-12">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none" style={{ color: '#1D5F31' }}>
          Modo Desenvolvedor
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider mt-3 text-slate-500">
          Monitoramento e inspeção de telas do ecossistema
        </p>
      </header>

      <div className="border-2 border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <Monitor size={18} style={{ color: '#1D5F31' }} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
            Atalhos de Navegação
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {links.map((link) => {
            const isDisabled = link.href === null
            return (
              <a
                key={link.title}
                href={link.href || '#'}
                target={link.href ? '_blank' : undefined}
                rel={link.href ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-4 px-6 py-5 transition-colors group ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'
                }`}
                onClick={isDisabled ? (e) => e.preventDefault() : undefined}
              >
                <div className={`w-10 h-10 flex items-center justify-center transition-colors ${
                  isDisabled ? 'bg-amber-50' : 'bg-slate-100 group-hover:bg-white'
                }`}>
                  {isDisabled ? (
                    <AlertTriangle size={18} className="text-amber-500" />
                  ) : (
                    <Eye size={18} className="text-slate-500 group-hover:text-[#1D5F31] transition-colors" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    isDisabled ? 'text-slate-400' : 'text-slate-900 group-hover:text-[#1D5F31]'
                  }`}>
                    {link.title}
                  </span>
                  <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                    isDisabled ? 'text-amber-500' : 'text-slate-500'
                  }`}>
                    {link.description}
                  </p>
                </div>
                {!isDisabled && (
                  <ExternalLink size={16} className="text-slate-300 group-hover:text-[#1D5F31] transition-colors" />
                )}
              </a>
            )
          })}
        </div>
      </div>

      <div className="border-2 border-amber-200 bg-amber-50 px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
          Acesso somente visual. Nenhuma permissão ou função de usuário é alterada.
        </p>
      </div>
    </div>
  )
}
