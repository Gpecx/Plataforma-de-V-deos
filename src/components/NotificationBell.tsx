"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, PlayCircle, CheckCheck, X, TrendingUp, Users, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore'
import { getPublicProfile } from '@/app/actions/profile'
import { parseFirebaseDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'


interface Notification {
    id: string
    type: 'reply' | 'new_lesson' | 'sale' | 'new_student' | 'lesson_rejected' | 'course_rejected' | 'lesson_approved' | 'course_approved' | 'course_deleted' | 'lesson_deleted' | 'deletion_rejected'
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
                // Busca cursos do professor
                const coursesRef = collection(db, 'courses')
                const coursesQuery = query(coursesRef, where('teacher_id', '==', user.uid))
                const coursesSnapshot = await getDocs(coursesQuery)
                const courseIds = coursesSnapshot.docs.map(doc => doc.id)

                // Array para acumular notificações
                let teacherNotifs: Notification[] = []

                // Busca notificações da coleção notifications (rejeições)
                const notifsRef = collection(db, 'notifications')
                const notifsQuery = query(notifsRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(10))
                const notifsSnapshot = await getDocs(notifsQuery)
                const rejectionNotifs: Notification[] = notifsSnapshot.docs.map(doc => {
                    const n = doc.data()
                    return {
                        id: doc.id,
                        type: n.type as any,
                        title: n.title || 'Notificação',
                        subtitle: n.message || '',
                        time: parseFirebaseDate(n.created_at)?.toLocaleDateString('pt-BR') || 'Recentemente',
                        read: n.read || false,
                        href: n.course_id ? `/dashboard-teacher/courses/${n.course_id}/edit` : '#'
                    }
                })
                teacherNotifs = [...rejectionNotifs]

                // Se tiver cursos, busca vendas
                if (courseIds.length > 0) {
                    const enrollmentsRef = collection(db, 'enrollments')
                    const enrollmentsQuery = query(enrollmentsRef, where('course_id', 'in', courseIds), orderBy('created_at', 'desc'), limit(5))
                    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
                    const saleNotifs: Notification[] = await Promise.all(enrollmentsSnapshot.docs.map(async (enrollDoc) => {
                        const e = enrollDoc.data()
                        const userData = await getPublicProfile(e.user_id)
                        const courseDoc = await getDoc(doc(db, 'courses', e.course_id))
                        const courseData = courseDoc.data()
                        return { id: enrollDoc.id, type: 'sale' as any, title: 'Nova venda realizada!', subtitle: `${userData?.full_name || 'Aluno'} comprou ${courseData?.title || 'Curso'}`, time: parseFirebaseDate(e.created_at)?.toLocaleDateString('pt-BR') || 'Recentemente', read: false, href: `/dashboard-teacher/analytics?saleId=${enrollDoc.id}` }
                    }))
                    teacherNotifs = [...teacherNotifs, ...saleNotifs]
                }

                // Ordena por mais recente (inverte para mostrar mais recentes primeiro)
                teacherNotifs.sort((a, b) => b.time.localeCompare(a.time))
                setNotifications(teacherNotifs.slice(0, 10))
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
            if (user) {
                fetchNotifications();

                const enrollmentsRef = collection(db, 'enrollments');
                const qEnroll = isTeacher ? query(enrollmentsRef, limit(1)) : query(enrollmentsRef, where('user_id', '==', user.uid), limit(1));
                const unsubscribeEnroll = onSnapshot(qEnroll, () => { fetchNotifications() });

                let unsubscribeNotifs = () => { };
                if (isTeacher) {
                    const notifsRef = collection(db, 'notifications');
                    const qNotifs = query(notifsRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(1));
                    unsubscribeNotifs = onSnapshot(qNotifs, () => { fetchNotifications() });
                }

                return () => {
                    unsubscribeEnroll();
                    unsubscribeNotifs();
                };
            } else {
                setNotifications([]);
                setLoading(false);
            }
        })
        return () => unsubscribeAuth()
    }, [isTeacher])

    const unread = notifications.filter(n => !n.read).length

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        const dbNotifTypes = ['lesson_rejected', 'course_rejected', 'lesson_approved', 'course_approved', 'course_deleted', 'lesson_deleted', 'deletion_rejected']
        const unreadNotifs = notifications.filter(n => !n.read && dbNotifTypes.includes(n.type))
        unreadNotifs.forEach(async (n) => {
            try {
                await updateDoc(doc(db, 'notifications', n.id), { read: true })
            } catch (err) { console.error('Error marking as read:', err) }
        })
    }

    const handleClick = async (notif: Notification) => {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setOpen(false);
        const dbNotifTypes = ['lesson_rejected', 'course_rejected', 'lesson_approved', 'course_approved', 'course_deleted', 'lesson_deleted', 'deletion_rejected']
        if (dbNotifTypes.includes(notif.type) && !notif.read) {
            try {
                await updateDoc(doc(db, 'notifications', notif.id), { read: true })
            } catch (err) { console.error('Error marking as read:', err) }
        }
        router.push(notif.href as any)
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(prev => !prev)} className={cn("transition cursor-pointer relative outline-none flex items-center justify-center", light ? "text-slate-900 hover:text-[#1D5F31]" : "text-white hover:text-[#1D5F31]")}>
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
                <div className="absolute right-0 mt-3 w-80 md:w-96 z-[1000] bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl">
                    {/* Header com contraste corrigido */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold uppercase tracking-tighter text-base text-slate-900">
                                {isTeacher ? 'Painel de Alertas' : 'Notificações'}
                            </h3>
                            {unread > 0 && (
                                <p className="text-[9px] font-bold uppercase tracking-[3px] mt-0.5 text-slate-500">
                                    {unread} novas interações
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {unread > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[2px] text-slate-600 hover:text-slate-900 transition px-3 py-1.5 border border-slate-200 hover:border-slate-400 rounded-lg">
                                    <CheckCheck size={12} /> Limpar
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-900 transition">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Lista Forçada */}
                    <div className="max-h-[400px] overflow-y-auto bg-white">
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <Bell size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[4px]">Tudo em dia!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className="w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-slate-50 last:border-0 group bg-white hover:bg-slate-50"
                                >
                                    <div className={cn(
                                        "w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 border rounded-xl",
                                        notif.read ? "bg-slate-50 border-slate-100" : "bg-[#1D5F31]/10 border-[#1D5F31]/20"
                                    )}>
                                        {notif.type === 'reply' && <MessageSquare size={18} className={notif.read ? "text-slate-400" : "text-[#1D5F31]"} />}
                                        {notif.type === 'new_lesson' && <PlayCircle size={18} className={notif.read ? "text-slate-400" : "text-[#1D5F31]"} />}
                                        {notif.type === 'sale' && <TrendingUp size={18} className={notif.read ? "text-slate-400" : "text-[#1D5F31]"} />}
                                        {notif.type === 'new_student' && <Users size={18} className={notif.read ? "text-slate-400" : "text-[#1D5F31]"} />}
                                        {(notif.type === 'lesson_rejected' || notif.type === 'course_rejected') && <AlertCircle size={18} className={notif.read ? "text-slate-400" : "text-red-500"} />}
                                        {(notif.type === 'lesson_approved' || notif.type === 'course_approved') && <CheckCircle2 size={18} className={notif.read ? "text-slate-400" : "text-[#1D5F31]"} />}
                                        {(notif.type === 'course_deleted' || notif.type === 'lesson_deleted') && <Trash2 size={18} className={notif.read ? "text-slate-400" : "text-orange-500"} />}
                                        {notif.type === 'deletion_rejected' && <AlertCircle size={18} className={notif.read ? "text-slate-400" : "text-red-500"} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-bold uppercase tracking-tight leading-tight mb-1",
                                            notif.read ? "text-slate-500" : "text-slate-900"
                                        )}>
                                            {notif.title}
                                        </p>
                                        <p className={cn(
                                            "text-[11px] truncate ",
                                            notif.read ? "text-slate-400" : "text-slate-600"
                                        )}>
                                            {notif.subtitle}
                                        </p>
                                    </div>
                                    {!notif.read && <div className="w-2 h-2 mt-2 shrink-0 rounded-full bg-[#1D5F31]" />}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button onClick={() => { setOpen(false); router.push(isTeacher ? '/dashboard-teacher/analytics' : '/dashboard-student/chat') }} className="w-full text-[9px] font-bold uppercase tracking-[3px] py-3 border border-slate-200 rounded-xl hover:border-[#1D5F31] text-slate-500 hover:text-[#1D5F31] transition-all bg-white shadow-sm">
                            {isTeacher ? 'Ver relatório de vendas' : 'Ver todas as mensagens'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}