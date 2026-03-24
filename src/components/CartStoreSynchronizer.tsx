'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { useCartStore } from '@/store/useCartStore'
import { getPurchasedCourseIds } from '@/app/actions/profile'

export function CartStoreSynchronizer() {
    const { user, loading: authLoading } = useAuth()
    const setPurchasedCourses = useCartStore((state) => state.setPurchasedCourses)

    useEffect(() => {
        async function syncPurchasedCourses() {
            if (!authLoading && user) {
                try {
                    const purchasedIds = await getPurchasedCourseIds(user.uid)
                    setPurchasedCourses(purchasedIds)
                } catch (error) {
                    console.error('Erro ao sincronizar cursos comprados:', error)
                    setPurchasedCourses([])
                }
            } else if (!authLoading && !user) {
                setPurchasedCourses([])
            }
        }

        syncPurchasedCourses()
    }, [user?.uid, authLoading, setPurchasedCourses])

    return null
}
