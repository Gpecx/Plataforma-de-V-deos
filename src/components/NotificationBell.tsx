"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, PlayCircle, CheckCheck, X, TrendingUp, Users, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { parseFirebaseDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { getTeacherNotificationsAction } from '@/app/(app)/dashboard-teacher/profile/actions'

interface Notification {
    id: string
    type: 'reply' | 'new_lesson' | 'sale' | 'new_student' | 'lesson_rejected' | 'course_rejected' | 'lesson_approved' | 'course_approved' | 'course_deleted' | 'lesson_deleted' | 'deletion_rejected'
    title: string
    subtitle: string
    time: any
    read: boolean
    href: string
}

function getRelativeTimeString(dateValue: any): string {
    if (!dateValue) return 'Recentemente'
    const date = parseFirebaseDate(dateValue)
    if (!date) return 'Data inválida'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora mesmo'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    if (diffDays < 30) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
    
    return date.toLocaleDateString('pt-BR')
}

export function NotificationBell({
    accent = '#1D5F31',
    isTeacher = false,
    light = false
}: {
    accent?: string,
    isTeacher?: boolean,
    light?: boolean
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const fetchNotifications = async () => {
        const user = auth.currentUser
        if (!user) return
        try {
            setLoading(true)
            if (isTeacher) {
                const result = await getTeacherNotificationsAction()
                if (result.success && result.notifications) {
                    setNotifications(result.notifications as any)
                } else {
                    setNotifications([])
                }
            } else {
                const enrollmentsRef = collection(db, 'enrollments')
                const enrollmentsQuery = query(enrollmentsRef, where('user_id', '==', user.uid))
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
                const myCourseIds = enrollmentsSnapshot.docs
                    .filter(doc => doc.data().payment_confirmed === true)
                    .map(doc => doc.data().course_id)
                if (myCourseIds.length === 0) { 
                    setNotifications([])
                    setLoading(false)
                    return 
                }
                const coursesRef = collection(db, 'courses')
                const coursesQuery = query(coursesRef, where('__name__', 'in', myCourseIds), orderBy('updated_at', 'desc'), limit(5))
                const coursesSnapshot = await getDocs(coursesQuery)
                const studentNotifs: Notification[] = coursesSnapshot.docs.map(courseDoc => {
                    const c = courseDoc.data()
                    return { 
                        id: courseDoc.id, 
                        type: 'new_lesson', 
                        title: 'Conteúdo atualizado!', 
                        subtitle: `Novas aulas em: ${c.title}`, 
                        time: c.updated_at, 
                        read: false, 
                        href: `/classroom/${courseDoc.id}` 
                    }
                })
                setNotifications(studentNotifs)
            }
        } catch (error) { 
            console.error("Erro ao buscar notificações:", error) 
        } finally { 
            setLoading(false) 
        }
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchNotifications()

                if (!isTeacher) {
                    const enrollmentsRef = collection(db, 'enrollments')
                    const qEnroll = query(enrollmentsRef, where('user_id', '==', user.uid), limit(1))
                    const unsubscribeEnroll = onSnapshot(qEnroll, () => { fetchNotifications() })
                    return () => {
                        unsubscribeEnroll()
                    }
                }
            } else {
                setNotifications([])
                setLoading(false)
            }
        })
        return () => unsubscribeAuth()
    }, [isTeacher])

    const unread = notifications.filter(n => !n.read).length

    const markAllRead = () => {
        setNotifications([])
    }

    const handleClick = (notif: Notification) => {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
        setOpen(false)
        if (notif.href && notif.href !== '#') {
            router.push(notif.href as any)
        }
    }

    const toggleOpen = () => {
        setOpen(prev => {
            const next = !prev
            if (next) fetchNotifications()
            return next
        })
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={toggleOpen} className={cn("transition cursor-pointer relative outline-none flex items-center justify-center", light ? "text-slate-900 hover:text-[#1D5F31]" : "text-white hover:text-[#1D5F31]")}>
                <Bell size={20} />
                {unread > 0 && (
                    <span className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full !text-white text-[11px] font-bold flex items-center justify-center border-2",
                        light ? "border-white" : "border-[#061629]"
                    )} style={{ backgroundColor: accent }}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 z-[1000] bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 rounded-lg">
                    {/* Header com contraste corrigido */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
                        <div>
                            <h3 className="font-bold uppercase tracking-tighter text-base !text-white">
                                {isTeacher ? 'Painel de Alertas' : 'Notificações'}
                            </h3>
                            {unread > 0 && (
                                <p className="text-[9px] font-bold uppercase tracking-[3px] mt-0.5 !text-slate-300">
                                    {unread} novas interações
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {unread > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[2px] !text-white hover:!text-white transition px-3 py-1.5 border border-slate-500 hover:border-slate-400 rounded-lg">
                                    <CheckCheck size={12} className="!text-white" /> Limpar
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="!text-white hover:!text-white/70 transition">
                                <X size={16} className="!text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Lista Forçada */}
                    <div className="max-h-[400px] overflow-y-auto bg-slate-900">
                        {loading ? (
                            <div className="py-12 text-center !text-slate-300 text-xs font-bold uppercase tracking-widest">Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <Bell size={40} className="mx-auto !text-slate-500 mb-4" />
                                <p className="text-[10px] font-bold uppercase !text-slate-300 tracking-[4px]">Tudo em dia!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className="w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-slate-700/50 last:border-0 group bg-slate-900 hover:bg-slate-800/50"
                                >
                                    <div className={cn(
                                        "w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 border rounded-xl",
                                        notif.read ? "bg-slate-800 border-slate-600" : "bg-[#1D5F31]/10 border-[#1D5F31]/20"
                                    )}>
                                        {notif.type === 'reply' && <MessageSquare size={18} className={notif.read ? "text-slate-300" : "text-[#1D5F31]"} />}
                                        {notif.type === 'new_lesson' && <PlayCircle size={18} className={notif.read ? "text-slate-300" : "text-[#1D5F31]"} />}
                                        {notif.type === 'sale' && <TrendingUp size={18} className={notif.read ? "text-slate-300" : "text-[#1D5F31]"} />}
                                        {notif.type === 'new_student' && <Users size={18} className={notif.read ? "text-slate-300" : "text-[#1D5F31]"} />}
                                        {(notif.type === 'lesson_rejected' || notif.type === 'course_rejected') && <AlertCircle size={18} className={notif.read ? "text-slate-300" : "text-red-500"} />}
                                        {(notif.type === 'lesson_approved' || notif.type === 'course_approved') && <CheckCircle2 size={18} className={notif.read ? "text-slate-300" : "text-[#1D5F31]"} />}
                                        {(notif.type === 'course_deleted' || notif.type === 'lesson_deleted') && <Trash2 size={18} className={notif.read ? "text-slate-300" : "text-orange-500"} />}
                                        {notif.type === 'deletion_rejected' && <AlertCircle size={18} className={notif.read ? "text-slate-300" : "text-red-500"} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-bold uppercase tracking-tight leading-tight mb-1",
                                            notif.read ? "!text-slate-300" : "!text-white"
                                        )}>
                                            {notif.title}
                                        </p>
                                        <p className={cn(
                                            "text-[11px] truncate mb-1",
                                            notif.read ? "!text-slate-300" : "!text-slate-200"
                                        )}>
                                            {notif.subtitle}
                                        </p>
                                        <p className="text-[9px] font-semibold !text-slate-400 uppercase tracking-wider">
                                            {getRelativeTimeString(notif.time)}
                                        </p>
                                    </div>
                                    {!notif.read && <div className="w-2 h-2 mt-2 shrink-0 rounded-full bg-[#1D5F31]" />}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
                        <button onClick={() => { setOpen(false); router.push(isTeacher ? '/dashboard-teacher/analytics' : '/dashboard-student/chat') }} className="w-full text-[9px] font-bold uppercase tracking-[3px] py-3 border border-slate-600 rounded-xl hover:border-[#1D5F31] !text-white hover:!text-[#1D5F31] transition-all bg-slate-700 shadow-sm">
                            {isTeacher ? 'Ver relatório de vendas' : 'Ver todas as mensagens'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}