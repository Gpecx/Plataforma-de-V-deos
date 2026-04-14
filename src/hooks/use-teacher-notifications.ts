"use client"

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthProvider'

export interface TeacherNotification {
    id: string
    type: 'sale' | 'message'
    message: string
    read: boolean
    createdAt: Timestamp
}

/**
 * Hook para escuta em tempo real de notificações do professor no Firestore.
 * Segue os requisitos de query (teacherId, read == false, createdAt desc, limit 50).
 */
export function useTeacherNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<TeacherNotification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setNotifications([])
            setLoading(false)
            return
        }

        // Query conforme requisito: teacherId, apenas lidas, ordenadas e limitadas.
        const q = query(
            collection(db, 'notifications'),
            where('teacherId', '==', user.uid),
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(50)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TeacherNotification[]

            setNotifications(notifs)
            setLoading(false)
        }, (error) => {
            console.error("[useTeacherNotifications] Erro onSnapshot:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    /**
     * Mark a notification as read in Firestore.
     */
    const markAsRead = async (notificationId: string) => {
        try {
            const docRef = doc(db, 'notifications', notificationId)
            await updateDoc(docRef, { read: true })
        } catch (error) {
            console.error("[useTeacherNotifications] Erro ao marcar como lida:", error)
        }
    }

    return { notifications, loading, markAsRead }
}
