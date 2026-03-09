'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'

export interface BannersData {
    hero_home: string[]
    hero_dashboard: string[]
    hero_course: string[]
}

export interface BrandingData {
    logoUrl: string
    siteName: string
    theme: 'modern' | 'classic' | 'minimalist'
    primaryColor: string
}

export interface GlobalSettings {
    banners: BannersData
    branding: BrandingData
}

const DEFAULT_SETTINGS: GlobalSettings = {
    banners: {
        hero_home: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop'],
        hero_dashboard: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop'],
        hero_course: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'],
    },
    branding: {
        logoUrl: '',
        siteName: 'SPCS Academy',
        theme: 'modern',
        primaryColor: '#00C402',
    }
}

export async function getSettings(): Promise<GlobalSettings> {
    try {
        const docRef = await adminDb.collection('settings').doc('global').get()
        if (docRef.exists) {
            const data = docRef.data()
            const b = data?.banners
            const br = data?.branding
            return {
                banners: {
                    hero_home: Array.isArray(b?.hero_home) ? b.hero_home : (b?.hero_home ? [b.hero_home] : DEFAULT_SETTINGS.banners.hero_home),
                    hero_dashboard: Array.isArray(b?.hero_dashboard) ? b.hero_dashboard : (b?.hero_dashboard ? [b.hero_dashboard] : DEFAULT_SETTINGS.banners.hero_dashboard),
                    hero_course: Array.isArray(b?.hero_course) ? b.hero_course : (b?.hero_course ? [b.hero_course] : DEFAULT_SETTINGS.banners.hero_course),
                },
                branding: {
                    logoUrl: br?.logoUrl || DEFAULT_SETTINGS.branding.logoUrl,
                    siteName: br?.siteName || DEFAULT_SETTINGS.branding.siteName,
                    theme: br?.theme || DEFAULT_SETTINGS.branding.theme,
                    primaryColor: br?.primaryColor || DEFAULT_SETTINGS.branding.primaryColor,
                }
            }
        }
        return DEFAULT_SETTINGS
    } catch (error) {
        console.error('Error fetching settings:', error)
        return DEFAULT_SETTINGS
    }
}

export async function saveSettings(settings: GlobalSettings): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false, error: 'Não autorizado' }
        }
        await adminDb.collection('settings').doc('global').set(settings, { merge: true })
        return { success: true }
    } catch (error) {
        console.error('Error saving settings:', error)
        return { success: false, error: 'Erro ao salvar configurações' }
    }
}

// Backward-compatible wrapper for getBanners (used by pages fetching only banners)
export async function getBanners(): Promise<BannersData> {
    const settings = await getSettings()
    return settings.banners
}
