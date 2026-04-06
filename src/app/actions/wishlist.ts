'use server'

import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getServerSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function toggleWishlist(courseId: string) {
    const session = await getServerSession()
    if (!session?.uid) {
        throw new Error('Usuário não autenticado')
    }

    const userId = session.uid
    const profileRef = adminDb.collection('profiles').doc(userId)
    const wishlistRef = profileRef.collection('wishlist').doc(courseId)

    try {
        const [profileDoc, wishlistDoc] = await Promise.all([
            profileRef.get(),
            wishlistRef.get()
        ])

        const profile = profileDoc.data()
        const purchasedCourseIds = profile?.cursos_comprados || []

        // Se já foi comprado, não permite adicionar e remove se já estiver lá
        if (purchasedCourseIds.includes(courseId)) {
            if (wishlistDoc.exists) {
                await wishlistRef.delete()
                revalidatePath('/dashboard-student/my-list')
                revalidatePath('/course')
                return { action: 'removed', courseId }
            }
            return { action: 'none', courseId, message: 'Curso já adquirido' }
        }
        
        if (wishlistDoc.exists) {
            await wishlistRef.delete()
            revalidatePath('/dashboard-student/my-list')
            revalidatePath('/course')
            return { action: 'removed', courseId }
        } else {
            await wishlistRef.set({
                courseId,
                addedAt: FieldValue.serverTimestamp()
            })
            revalidatePath('/dashboard-student/my-list')
            revalidatePath('/course')
            return { action: 'added', courseId }
        }
    } catch (error) {
        console.error('Erro ao toggle wishlist:', error)
        throw new Error('Erro ao atualizar wishlist')
    }
}

export async function getWishlistCourseIds(): Promise<string[]> {
    const session = await getServerSession()
    if (!session?.uid) {
        return []
    }

    try {
        const wishlistSnapshot = await adminDb
            .collection('profiles')
            .doc(session.uid)
            .collection('wishlist')
            .get()

        return wishlistSnapshot.docs.map(doc => doc.id)
    } catch (error) {
        console.error('Erro ao buscar wishlist:', error)
        return []
    }
}

export async function getWishlistCourses() {
    const session = await getServerSession()
    if (!session?.uid) {
        return []
    }

    try {
        const wishlistSnapshot = await adminDb
            .collection('profiles')
            .doc(session.uid)
            .collection('wishlist')
            .orderBy('addedAt', 'desc')
            .get()

        if (wishlistSnapshot.empty) {
            return []
        }

        const courseIds = wishlistSnapshot.docs.map(doc => doc.id)

        const coursesSnapshot = await adminDb
            .collection('courses')
            .where('__name__', 'in', courseIds)
            .get()

        return coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Erro ao buscar cursos da wishlist:', error)
        return []
    }
}

export async function isCourseInWishlist(courseId: string): Promise<boolean> {
    const session = await getServerSession()
    if (!session?.uid) {
        return false
    }

    try {
        const doc = await adminDb
            .collection('profiles')
            .doc(session.uid)
            .collection('wishlist')
            .doc(courseId)
            .get()

        return doc.exists
    } catch (error) {
        console.error('Erro ao verificar wishlist:', error)
        return false
    }
}