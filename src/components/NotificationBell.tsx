"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, PlayCircle, CheckCheck, X } from 'lucide-react'

interface Notification {
    id: string
    type: 'reply' | 'new_lesson'
    title: string
    subtitle: string
    time: string
    read: boolean
    href: string
}

// Mock notifications — replace with real Supabase fetch later
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'reply',
        title: 'Professor respondeu sua dúvida',
        subtitle: 'Curso: Dominando o Marketing Digital',
        time: '5 min atrás',
        read: false,
        href: '/dashboard-student/messages',
    },
    {
        id: '2',
        type: 'new_lesson',
        title: 'Nova aula disponível!',
        subtitle: 'Módulo 3 — Estratégias Avançadas de Venda',
        time: '1h atrás',
        read: false,
        href: '/classroom/1',
    },
    {
        id: '3',
        type: 'reply',
        title: 'Professor respondeu sua dúvida',
        subtitle: 'Curso: Copywriting de Elite',
        time: '3h atrás',
        read: true,
        href: '/dashboard-student/messages',
    },
    {
        id: '4',
        type: 'new_lesson',
        title: 'Nova aula disponível!',
        subtitle: 'Módulo 2 — Framework de Fechamento',
        time: 'Ontem',
        read: true,
        href: '/classroom/2',
    },
]

export function NotificationBell({ accent = '#00C402' }: { accent?: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

    const unread = notifications.filter(n => !n.read).length

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const handleClick = (notif: Notification) => {
        setNotifications(prev =>
            prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
        )
        setOpen(false)
        router.push(notif.href)
    }

    return (
        <div className="relative">
            {/* Bell Trigger */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="text-gray-400 hover:text-white transition cursor-pointer relative outline-none"
            >
                <Bell size={20} />
                {unread > 0 && (
                    <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-black text-[9px] font-black flex items-center justify-center border border-[#061629] animate-in zoom-in duration-300"
                        style={{ backgroundColor: accent }}
                    >
                        {unread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    <div className="absolute right-0 mt-3 w-96 z-50 bg-[#0a1f3a]/95 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <h3 className="font-black uppercase italic tracking-tighter text-base">Notificações</h3>
                                {unread > 0 && (
                                    <p className="text-[9px] font-black uppercase tracking-[3px] mt-0.5" style={{ color: accent }}>
                                        {unread} não lidas
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {unread > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[2px] text-gray-500 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
                                    >
                                        <CheckCheck size={12} />
                                        Marcar todas
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white transition">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell size={32} className="mx-auto text-gray-700 mb-3" />
                                    <p className="text-xs font-bold uppercase text-gray-600 tracking-widest">Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-white/5 last:border-0 group ${notif.read ? 'opacity-50 hover:opacity-100' : 'hover:bg-white/5'}`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${notif.read ? 'bg-white/5' : ''}`}
                                            style={!notif.read ? { backgroundColor: `${accent}20`, boxShadow: `0 0 20px ${accent}30` } : {}}
                                        >
                                            {notif.type === 'reply' ? (
                                                <MessageSquare size={18} style={{ color: notif.read ? '#4B5563' : accent }} />
                                            ) : (
                                                <PlayCircle size={18} style={{ color: notif.read ? '#4B5563' : accent }} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black uppercase tracking-tight leading-tight mb-1 ${notif.read ? 'text-gray-500' : 'text-white'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 truncate italic">{notif.subtitle}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[2px] mt-2" style={{ color: notif.read ? '#374151' : accent }}>
                                                {notif.time}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: accent }} />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/5">
                            <button
                                onClick={() => { setOpen(false); router.push('/dashboard-student/messages') }}
                                className="w-full text-[9px] font-black uppercase tracking-[3px] py-3 rounded-xl border border-white/5 hover:border-white/20 text-gray-500 hover:text-white transition-all"
                            >
                                Ver todas as mensagens
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
