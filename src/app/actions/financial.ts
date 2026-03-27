'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export interface PlanData {
    id: string
    name: string
    price: number
    features: string[]
    active: boolean
}

export interface FinancialSettings {
    platformTax: number
    plans: PlanData[]
}

const DEFAULT_PLANS: PlanData[] = [
    {
        id: 'basic',
        name: 'Basic',
        price: 29.90,
        features: ['Acesso a cursos básicos', 'Certificado digital'],
        active: true
    },
    {
        id: 'premium',
        name: 'Premium Elite',
        price: 49.90,
        features: ['Todos os Treinamentos', 'Certificados Ilimitados', 'Mentorias ao Vivo', 'Comunidade Exclusiva'],
        active: true
    }
]

/**
 * Fetches platform tax and plan settings.
 */
export async function getFinancialSettings(): Promise<FinancialSettings> {
    try {
        // Get Tax
        const taxDoc = await adminDb.collection('config').doc('platform_settings').get()
        const platformTax = taxDoc.exists ? (taxDoc.data()?.platform_tax || 20) : 20

        // Get Plans
        const plansSnap = await adminDb.collection('config').doc('plans').get()
        let plans = DEFAULT_PLANS

        if (plansSnap.exists) {
            const data = plansSnap.data()
            if (data?.items) {
                plans = data.items
            }
        }

        return { platformTax, plans }
    } catch (error) {
        console.error("Error fetching financial settings:", error)
        return { platformTax: 20, plans: DEFAULT_PLANS }
    }
}

/**
 * Updates the entire financial settings object.
 */
export async function saveFinancialSettings(settings: FinancialSettings) {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false, error: 'Não autorizado' }
        }

        const batch = adminDb.batch()

        // Save Tax
        const taxRef = adminDb.collection('config').doc('platform_settings')
        batch.set(taxRef, { 
            platform_tax: Number(settings.platformTax),
            updated_at: new Date()
        }, { merge: true })

        // Save Plans
        const plansRef = adminDb.collection('config').doc('plans')
        batch.set(plansRef, {
            items: settings.plans,
            updated_at: new Date()
        }, { merge: true })

        await batch.commit()

        revalidatePath('/admin/dashboard')
        revalidatePath('/admin/financial')
        revalidatePath('/dashboard-student/subscriptions')
        
        return { success: true }
    } catch (error) {
        console.error("Error saving financial settings:", error)
        return { success: false, error: 'Erro ao salvar configurações financeiras' }
    }
}
