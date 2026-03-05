"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, PlayCircle, CheckCheck, X, TrendingUp, Users } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, getDoc, orderBy, limit, onSnapshot, doc } from 'firebase/firestore'
import { formatShortDateBR } from '@/lib/date-utils'

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
    accent = '#00C402',
    isTeacher = false
}: {
    accent?: string,
    isTeacher?: boolean
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        const user = auth.currentUser
        if (!user) return

        try {
            if (isTeacher) {
                // Notificações de Professor: Novas Matrículas/Vendas
                const coursesSnap = await getDocs(query(collection(db, 'courses'), where('teacher_id', '==', user.uid)))
                const courseIds = coursesSnap.docs.map(doc => doc.id)

                if (courseIds.length > 0) {
                    const enrollmentsSnap = await getDocs(
                        query(
                            collection(db, 'enrollments'),
                            orderBy('created_at', 'desc'),
                            limit(5)
                        )
                    )
                    // Filtramos em memória se o volume for baixo, ou usamos 'in' se courseIds <= 30
                    const teacherEnrollments = enrollmentsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() as any }))
                        .filter(e => courseIds.includes(e.course_id))

                    const uniqueUserIds = Array.from(new Set(teacherEnrollments.map(e => e.user_id)))
                    const profilesMap = new Map()
                    await Promise.all(uniqueUserIds.map(async (uid) => {
                        const profileSnap = await getDoc(doc(db, 'profiles', uid))
                        if (profileSnap.exists()) {
                            profilesMap.set(uid, profileSnap.data())
                        }
                    }))

                    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]))

                    const teacherNotifs: Notification[] = teacherEnrollments.map(e => ({
                        id: e.id.toString(),
                        type: 'sale',
                        title: 'Nova venda realizada!',
                        subtitle: `${profilesMap.get(e.user_id)?.full_name || 'Aluno'} comprou ${coursesMap.get(e.course_id)?.title}`,
                        time: formatShortDateBR(e.created_at),
                        read: false,
                        href: `/dashboard-teacher/analytics?saleId=${e.id}`
                    }))
                    setNotifications(teacherNotifs)
                }
            } else {
                // Notificações de Aluno
                const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('user_id', '==', user.uid)))
                const myCourseIds = enrollmentsSnap.docs.map(doc => (doc.data() as any).course_id)

                if (myCourseIds.length > 0) {
                    // Firestore 'in' limit
                    const recentCoursesSnap = await getDocs(
                        query(
                            collection(db, 'courses'),
                            orderBy('updated_at', 'desc'),
                            limit(5)
                        )
                    )
                    const studentNotifs: Notification[] = recentCoursesSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() as any }))
                        .filter(c => myCourseIds.includes(c.id))
                        .map(c => ({
                            id: c.id.toString(),
                            type: 'new_lesson',
                            title: 'Conteúdo atualizado!',
                            subtitle: `Novas aulas em: ${c.title}`,
                            time: formatShortDateBR(c.updated_at),
                            read: false,
                            href: `/classroom/${c.id}`
                        }))
                    setNotifications(studentNotifs)
                }
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchNotifications()
            } else {
                setNotifications([])
                setLoading(false)
            }
        })

        return () => unsubscribeAuth()
    }, [isTeacher])

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
                                        Limpar
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
                                <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Tudo em dia!</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full flex items-start gap-4 px-6 py-5 text-left transition-all border-b border-slate-50 last:border-0 group ${notif.read ? 'opacity-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${notif.read ? 'bg-slate-50' : 'bg-slate-100'}`}
                                        >
                                            {notif.type === 'reply' && <MessageSquare size={18} style={{ color: notif.read ? '#94A3B8' : accent }} />}
                                            {notif.type === 'new_lesson' && <PlayCircle size={18} style={{ color: notif.read ? '#94A3B8' : accent }} />}
                                            {notif.type === 'sale' && <TrendingUp size={18} style={{ color: notif.read ? '#94A3B8' : accent }} />}
                                            {notif.type === 'new_student' && <Users size={18} style={{ color: notif.read ? '#94A3B8' : accent }} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black uppercase tracking-tight leading-tight mb-1 ${notif.read ? 'text-slate-400' : 'text-slate-700'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate italic">{notif.subtitle}</p>
                                        </div>

                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: accent }} />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100">
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
