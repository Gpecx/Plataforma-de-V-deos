"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, PlayCircle, CheckCheck, X, TrendingUp, Users } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { getPublicProfile } from '@/app/actions/profile'
import { parseFirebaseDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    type: 'reply' | 'new_lesson' | 'sale' | 'new_student'
    title: string
    subtitle: string
    time: string
    read: boolean
    href: string
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
            if (isTeacher) {
                const coursesRef = collection(db, 'courses')
                const coursesQuery = query(coursesRef, where('teacher_id', '==', user.uid))
                const coursesSnapshot = await getDocs(coursesQuery)
                const courseIds = coursesSnapshot.docs.map(doc => doc.id)
                if (courseIds.length === 0) { setNotifications([]); setLoading(false); return }
                const enrollmentsRef = collection(db, 'enrollments')
                const enrollmentsQuery = query(enrollmentsRef, where('course_id', 'in', courseIds), orderBy('created_at', 'desc'), limit(5))
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
                const teacherNotifs: Notification[] = await Promise.all(enrollmentsSnapshot.docs.map(async (enrollDoc) => {
                    const e = enrollDoc.data()
                    const userData = await getPublicProfile(e.user_id)
                    const courseDoc = await getDoc(doc(db, 'courses', e.course_id))
                    const courseData = courseDoc.data()
                    return { id: enrollDoc.id, type: 'sale', title: 'Nova venda realizada!', subtitle: `${userData?.full_name || 'Aluno'} comprou ${courseData?.title || 'Curso'}`, time: parseFirebaseDate(e.created_at)?.toLocaleDateString('pt-BR') || 'Recentemente', read: false, href: `/dashboard-teacher/analytics?saleId=${enrollDoc.id}` }
                }))
                setNotifications(teacherNotifs)
            } else {
                const enrollmentsRef = collection(db, 'enrollments')
                const enrollmentsQuery = query(enrollmentsRef, where('user_id', '==', user.uid))
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
                const myCourseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id)
                if (myCourseIds.length === 0) { setNotifications([]); setLoading(false); return }
                const coursesRef = collection(db, 'courses')
                const coursesQuery = query(coursesRef, where('__name__', 'in', myCourseIds), orderBy('updated_at', 'desc'), limit(5))
                const coursesSnapshot = await getDocs(coursesQuery)
                const studentNotifs: Notification[] = coursesSnapshot.docs.map(courseDoc => {
                    const c = courseDoc.data()
                    return { id: courseDoc.id, type: 'new_lesson', title: 'Conteúdo atualizado!', subtitle: `Novas aulas em: ${c.title}`, time: parseFirebaseDate(c.updated_at)?.toLocaleDateString('pt-BR') || 'Recentemente', read: false, href: `/classroom/${courseDoc.id}` }
                })
                setNotifications(studentNotifs)
            }
        } catch (error) { console.error("Erro ao buscar notificações:", error) } finally { setLoading(false) }
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) { fetchNotifications(); const enrollmentsRef = collection(db, 'enrollments'); const q = isTeacher ? query(enrollmentsRef, limit(1)) : query(enrollmentsRef, where('user_id', '==', user.uid), limit(1)); const unsubscribeSnap = onSnapshot(q, () => { fetchNotifications() }); return () => unsubscribeSnap() } else { setNotifications([]); setLoading(false) }
        })
        return () => unsubscribeAuth()
    }, [isTeacher])

    const unread = notifications.filter(n => !n.read).length
    const markAllRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))) }
    const handleClick = (notif: Notification) => { setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n)); setOpen(false); router.push(notif.href) }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(prev => !prev)} className={cn("transition cursor-pointer relative outline-none flex items-center justify-center", light ? "text-slate-600 hover:text-slate-900" : "text-white hover:text-[#1D5F31]")}>
                <Bell size={20} />
                {unread > 0 && (
                    <span className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2",
                        light ? "border-white" : "border-[#061629]"
                    )} style={{ backgroundColor: accent }}>
                        {unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 z-[1000] !bg-[#061629] border border-[#1D5F31]/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header com contraste corrigido */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1D5F31]/20">
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-base !text-white">
                                    {isTeacher ? 'Painel de Alertas' : 'Notificações'}
                                </h3>
                                {unread > 0 && (
                                    <p className="text-[9px] font-black uppercase tracking-[3px] mt-0.5 !text-slate-400">
                                        {unread} novas interações
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {unread > 0 && (
                                    <button onClick={markAllRead} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[2px] !text-slate-200 hover:!text-white transition px-3 py-1.5 border border-[#1D5F31]/30 hover:border-[#1D5F31]">
                                        <CheckCheck size={12} /> Limpar
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="!text-slate-400 hover:!text-white transition">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Lista Forçada */}
                        <div className="max-h-[400px] overflow-y-auto !bg-[#061629]">
                            {loading ? (
                                <div className="py-12 text-center !text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Bell size={40} className="mx-auto !text-[#1D5F31]/20 mb-4" />
                                    <p className="text-[10px] font-black uppercase !text-slate-500 tracking-[4px]">Tudo em dia!</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className="w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-[#1D5F31]/10 last:border-0 group !bg-[#061629] hover:!bg-white/5"
                                    >
                                        <div className={`w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 border border-[#1D5F31]/20 ${notif.read ? '!bg-[#061629]' : '!bg-[#061629]'}`}>
                                            {notif.type === 'reply' && <MessageSquare size={18} className={notif.read ? "!text-slate-600" : "!text-white"} />}
                                            {notif.type === 'new_lesson' && <PlayCircle size={18} className={notif.read ? "!text-slate-600" : "!text-white"} />}
                                            {notif.type === 'sale' && <TrendingUp size={18} className={notif.read ? "!text-slate-600" : "!text-white"} />}
                                            {notif.type === 'new_student' && <Users size={18} className={notif.read ? "!text-slate-600" : "!text-white"} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black uppercase tracking-tight leading-tight mb-1 ${notif.read ? '!text-slate-600' : '!text-white'}`}>
                                                {notif.title}
                                            </p>
                                            <p className={`text-[11px] truncate italic ${notif.read ? '!text-slate-700' : '!text-slate-200'}`}>
                                                {notif.subtitle}
                                            </p>
                                        </div>
                                        {!notif.read && <div className="w-2 h-2 mt-2 shrink-0 animate-pulse !bg-[#1D5F31]" />}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[#1D5F31]/20 !bg-[#061629]">
                            <button onClick={() => { setOpen(false); router.push(isTeacher ? '/dashboard-teacher/analytics' : '/dashboard-student/chat') }} className="w-full text-[9px] font-black uppercase tracking-[3px] py-3 border border-[#1D5F31]/30 hover:border-[#1D5F31] !text-slate-300 hover:!text-[#1D5F31] transition-all">
                                {isTeacher ? 'Ver relatório de vendas' : 'Ver todas as mensagens'}
                            </button>
                        </div>
                    </div>
            )}
        </div>
    )
}