"use client"

import { Clock, AlertCircle, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut as firebaseSignOut } from 'firebase/auth'

interface TeacherStatusGuardProps {
  status: 'pending' | 'rejected'
  rejectionReason?: string
  userName?: string
}

export function TeacherStatusGuard({ status, rejectionReason, userName }: TeacherStatusGuardProps) {
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

          {status === 'rejected' && rejectionReason && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-left">
              <p className="text-sm font-semibold text-red-800 mb-1">
                Motivo da reprovação:
              </p>
              <p className="text-sm text-red-700 leading-relaxed">
                {rejectionReason}
              </p>
            </div>
          )}

          {userName && (
            <p className="text-sm text-slate-500 mb-6">
              Olá, <span className="font-semibold text-slate-700">{userName}</span>
            </p>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={async () => {
                try {
                  await firebaseSignOut(auth)
                  await fetch('/api/auth/signout', { 
                    method: 'POST',
                    credentials: 'include'
                  })
                } finally {
                  document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
                  document.cookie = 'active_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
                  window.location.replace('/')
                }
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#061629] text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#0a1f33] transition-all"
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