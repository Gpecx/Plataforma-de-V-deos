"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, CheckCheck, X, TrendingUp, Users, Loader2 } from 'lucide-react'
import { useTeacherNotifications } from '@/hooks/use-teacher-notifications'
import { formatShortDateBR } from '@/lib/date-utils'

/**
 * NotificationBell Component
 * Refatorado para consumir o hook useTeacherNotifications no dashboard do professor.
 * Mantém consistência visual premium com animações e micro-interações.
 */
export function NotificationBell({
    accent = '#00C402',
    isTeacher = false
}: {
    accent?: string,
    isTeacher?: boolean
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    // Consumindo o novo sistema em tempo real se for professor
    const { notifications, loading, markAsRead } = useTeacherNotifications()

    const unread = notifications.filter(n => !n.read).length

    const handleClick = async (notifId: string, type: string) => {
        // Interação instantânea: marca como lida
        await markAsRead(notifId)

        // Opcional: Redirecionar dependendo do tipo ou fechar
        if (type === 'sale') {
            router.push('/dashboard-teacher/analytics')
        }
        setOpen(false)
    }

    const markAllRead = async () => {
        const promises = notifications.map(n => markAsRead(n.id))
        await Promise.all(promises)
    }

    return (
        <div className="relative">
            {/* Bell Trigger */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="text-slate-900 hover:text-[#00C402] transition cursor-pointer relative outline-none flex items-center justify-center p-1"
            >
                <Bell size={20} />
                {unread > 0 && (
                    <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center border border-white animate-in zoom-in duration-300"
                        style={{ backgroundColor: accent }}
                    >
                        {unread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    <div className="absolute right-0 mt-3 w-80 md:w-96 z-50 bg-white border border-slate-200 rounded-[28px] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-base text-slate-700">
                                    {isTeacher ? 'Painel de Alertas' : 'Notificações'}
                                </h3>
                                {unread > 0 && (
                                    <p className="text-[9px] font-black uppercase tracking-[3px] mt-0.5" style={{ color: accent }}>
                                        {unread} novas interações
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {unread > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[2px] text-slate-400 hover:text-slate-600 transition px-3 py-1.5 rounded-lg border border-slate-100 hover:border-slate-200"
                                    >
                                        <CheckCheck size={12} />
                                        Limpar Tudo
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-slate-200" size={32} />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Bell size={24} className="text-slate-200" />
                                    </div>
                                    <p className="text-xs font-bold uppercase text-slate-400 tracking-widest italic">Tudo em dia!</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif.id, notif.type)}
                                        className="w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-slate-50 last:border-0 group hover:bg-slate-50"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 transition-all bg-slate-100 group-hover:scale-110"
                                        >
                                            {notif.type === 'message' && <MessageSquare size={18} style={{ color: accent }} />}
                                            {notif.type === 'sale' && <TrendingUp size={18} style={{ color: accent }} />}
                                            {!['message', 'sale'].includes(notif.type) && <Bell size={18} style={{ color: accent }} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black uppercase tracking-tight leading-tight mb-1 text-slate-700">
                                                {notif.type === 'sale' ? 'Venda Confirmada!' : 'Nova Mensagem'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">{notif.message}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-2">
                                                {notif.createdAt?.toDate ? formatShortDateBR(notif.createdAt.toDate()) : 'Recentemente'}
                                            </p>
                                        </div>

                                        <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-[#00C402]" />
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => { setOpen(false); router.push(isTeacher ? '/dashboard-teacher/analytics' : '/dashboard-student/chat') }}
                                className="w-full text-[9px] font-black uppercase tracking-[3px] py-3 rounded-xl border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-slate-700 transition-all outline-none"
                            >
                                {isTeacher ? 'Ver relatório de vendas' : 'Ver todas as mensagens'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
