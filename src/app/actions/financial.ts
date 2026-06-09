'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'
import { parseFirebaseDate } from '@/lib/date-utils'

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

export interface TeacherCourseItem {
    id: string
    title: string
    price: number
    status: string
    customFeePlatform: number | null
}

export interface TeacherItem {
    id: string
    fullName: string
    email: string
    avatarUrl: string
    courses: TeacherCourseItem[]
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
        const session = await getSessionUser() // SEC
        if (!session || session.role !== 'admin') { // SEC
            return { platformTax: 20, plans: DEFAULT_PLANS } // SEC
        } // SEC
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

        return JSON.parse(JSON.stringify({ platformTax, plans }))
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
        // revalidatePath('/dashboard-student/subscriptions')
        
        return { success: true }
    } catch (error) {
        console.error("Error saving financial settings:", error)
        return { success: false, error: 'Erro ao salvar configurações financeiras' }
    }
}

/**
 * Busca todos os professores ativos com seus respectivos cursos e taxas customizadas.
 */
export async function getTeachersWithCourses(): Promise<TeacherItem[]> {
    const session = await getSessionUser()
    if (!session || session.role !== 'admin') {
        return []
    }
    try {
        const profilesSnap = await adminDb.collection('profiles')
            .where('role', '==', 'teacher')
            .where('teacher_status', 'in', ['active', 'approved'])
            .get()

        const teachers = await Promise.all(profilesSnap.docs.map(async (doc) => {
            const data = doc.data()

            const coursesSnap = await adminDb.collection('courses')
                .where('teacher_id', '==', doc.id)
                .get()

            const courses: TeacherCourseItem[] = coursesSnap.docs.map(c => {
                const cd = c.data()
                return {
                    id: c.id,
                    title: cd.title || 'Sem título',
                    price: cd.price || 0,
                    status: cd.status || 'PENDENTE',
                    customFeePlatform: cd.custom_fee_platform ?? null,
                }
            })

            return {
                id: doc.id,
                fullName: data.full_name || 'Sem nome',
                email: data.email || '',
                avatarUrl: data.avatar_url || '',
                courses,
            }
        }))

        return JSON.parse(JSON.stringify(teachers))
    } catch (error) {
        console.error("Error fetching teachers with courses:", error)
        return []
    }
}

/**
 * Salva a taxa customizada da plataforma para um curso específico.
 * Se platformFee for null, remove a taxa customizada (volta ao valor global).
 */
export async function saveCustomCourseFee(courseId: string, platformFee: number | null) {
    const session = await getSessionUser()
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' }
    }
    try {
        if (platformFee !== null && (platformFee < 0 || platformFee > 100)) {
            return { success: false, error: 'Taxa deve estar entre 0 e 100' }
        }

        const updateData: any = { updated_at: new Date() }
        if (platformFee === null) {
            updateData.custom_fee_platform = null
        } else {
            updateData.custom_fee_platform = platformFee
        }

        await adminDb.collection('courses').doc(courseId).update(updateData)
        revalidatePath('/admin/financial')
        return { success: true }
    } catch (error) {
        console.error("Error saving custom course fee:", error)
        return { success: false, error: 'Erro ao salvar taxa customizada' }
    }
}
