"use client"

import { Clock, AlertCircle, LogOut, Mail } from 'lucide-react'

interface TeacherStatusGuardProps {
  status: 'pending' | 'rejected'
  userName?: string
}

export function TeacherStatusGuard({ status, userName }: TeacherStatusGuardProps) {
  const content = {
    pending: {
      icon: Clock,
      title: 'Aguardando Aprovação',
      message: 'Sua solicitação para se tornar instrutor PowerPlay foi recebida. Nossa equipe está analisando seus dados e em breve você receberá uma confirmação.',
      color: 'bg-amber-50',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-200',
      buttonText: 'Sair da Conta',
    },
    rejected: {
      icon: AlertCircle,
      title: 'Cadastro Reprovado',
      message: 'Infelizmente sua solicitação não foi aprovada neste momento. Para mais informações, entre em contato com o suporte.',
      color: 'bg-red-50',
      iconColor: 'text-red-500',
      borderColor: 'border-red-200',
      buttonText: 'Entrar em Contato',
    }
  }

  const config = content[status]

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className={`max-w-lg w-full ${config.color} border ${config.borderColor} rounded-2xl p-8 shadow-lg`}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 ${config.iconColor} mb-6 flex items-center justify-center`}>
            <config.icon size={64} strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-tight">
            {config.title}
          </h1>

          <p className="text-slate-600 mb-6 leading-relaxed">
            {config.message}
          </p>

          {userName && (
            <p className="text-sm text-slate-500 mb-6">
              Olá, <span className="font-semibold text-slate-700">{userName}</span>
            </p>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.href = '/contact'}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#061629] text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#0a1f33] transition-all"
            >
              <Mail size={16} />
              {config.buttonText}
            </button>
            
            <button
              onClick={() => {
                document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                window.location.href = '/login'
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-600 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-slate-100 transition-all"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
