'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'

export interface BannersData {
    hero_home: string[]
    hero_dashboard: string[]
    hero_course: string[]
}

const DEFAULT_BANNERS: BannersData = {
    hero_home: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop'],
    hero_dashboard: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop'],
    hero_course: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop']
}

export async function getBanners(): Promise<BannersData> {
    try {
        const docRef = await adminDb.collection('settings').doc('global').get()
        if (docRef.exists) {
            const data = docRef.data()
            if (data?.banners) {
                // Ensure arrays even if data somehow has strings from previous version
                const b = data.banners;
                return {
                    hero_home: Array.isArray(b.hero_home) ? b.hero_home : (b.hero_home ? [b.hero_home] : DEFAULT_BANNERS.hero_home),
                    hero_dashboard: Array.isArray(b.hero_dashboard) ? b.hero_dashboard : (b.hero_dashboard ? [b.hero_dashboard] : DEFAULT_BANNERS.hero_dashboard),
                    hero_course: Array.isArray(b.hero_course) ? b.hero_course : (b.hero_course ? [b.hero_course] : DEFAULT_BANNERS.hero_course),
                }
            }
        }
        return DEFAULT_BANNERS
    } catch (error) {
        console.error('Error fetching banners:', error)
        return DEFAULT_BANNERS
    }
}

export async function saveBanners(banners: BannersData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false, error: 'Não autorizado' }
        }

        await adminDb.collection('settings').doc('global').set({
            banners
        }, { merge: true })

        return { success: true }
    } catch (error) {
        console.error('Error saving banners:', error)
        return { success: false, error: 'Erro ao salvar os banners' }
    }
}
