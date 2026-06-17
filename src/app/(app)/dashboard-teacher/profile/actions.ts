'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
    full_name: z.string().min(1, 'Nome é obrigatório'),
    specialty: z.string().nullable().optional().transform(val => val || ''),
    bio: z.string().nullable().optional().transform(val => val || ''),
    avatar_url: z.string().nullable().optional().transform(val => val || ''),
    website: z.string().nullable().optional().transform(val => val || ''),
    linkedin: z.string().nullable().optional().transform(val => val || ''),
    twitter: z.string().nullable().optional().transform(val => val || ''),
    youtube: z.string().nullable().optional().transform(val => val || ''),
    instagram: z.string().nullable().optional().transform(val => val || ''),
    tiktok: z.string().nullable().optional().transform(val => val || ''),
})

export async function updateTeacherProfile(data: any) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado')
    }

    const validatedData = profileSchema.parse(data)

    try {
        const updateData: Record<string, any> = {
            full_name: validatedData.full_name,
            specialty: validatedData.specialty,
            bio: validatedData.bio,
            avatar_url: validatedData.avatar_url,
            linkedin: validatedData.linkedin,
            website: validatedData.website,
            twitter: validatedData.twitter,
            youtube: validatedData.youtube,
            instagram: validatedData.instagram,
            tiktok: validatedData.tiktok,
            updated_at: new Date().toISOString()
        }

        await adminDb.collection('profiles').doc(session.uid).update(updateData)
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar perfil do professor", error)
        throw new Error("Erro ao salvar o perfil")
    }
}

export async function getTeacherProfile() {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        return { success: false, error: 'Não autorizado' }
    }

    try {
        const profileDoc = await adminDb.collection('profiles').doc(session.uid).get()
        const data = profileDoc.data()
        if (!data) return { success: true, data: null }

        function serializeFirestoreData(input: Record<string, any>): Record<string, any> {
            const result: Record<string, any> = {}
            for (const [key, value] of Object.entries(input)) {
                if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
                    result[key] = new Date((value as any)._seconds * 1000).toISOString()
                } else if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
                    result[key] = (value as any).toDate().toISOString()
                } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                    result[key] = serializeFirestoreData(value)
                } else {
                    result[key] = value
                }
            }
            return result
        }

        const plainData = serializeFirestoreData(data as Record<string, any>)

        return { success: true, data: plainData }
    } catch (error) {
        return { success: false, error: 'Erro ao buscar perfil' }
    }
}

export async function updateTeacherSettings(prevState: any, formData: FormData) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        return { success: false, error: 'Não autorizado' }
    }

    try {
        const phone = formData.get('phone') as string
        const pixKey = formData.get('pix_key') as string
        const bankName = formData.get('bank_name') as string
        const bankAgency = formData.get('bank_agency') as string
        const bankAccount = formData.get('bank_account') as string
        const bankAccountType = formData.get('bank_account_type') as string
        const cep = formData.get('cep') as string
        const logradouro = formData.get('logradouro') as string
        const numero = formData.get('numero') as string
        const bairro = formData.get('bairro') as string
        const cidade = formData.get('cidade') as string
        const estado = formData.get('estado') as string
        const notifications_email = formData.get('notifications_email') === 'on'
        const notifications_push = formData.get('notifications_push') === 'on'

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            notifications_email,
            notifications_push
        }

        if (phone) updateData.phone = phone
        if (pixKey !== null) updateData.pix_key = pixKey
        if (bankName !== null) updateData.bank_name = bankName
        if (bankAgency !== null) updateData.bank_agency = bankAgency
        if (bankAccount !== null) updateData.bank_account = bankAccount
        if (bankAccountType !== null) updateData.bank_account_type = bankAccountType
        if (cep) updateData.cep = cep
        if (logradouro) updateData.logradouro = logradouro
        if (numero) updateData.numero = numero
        if (bairro) updateData.bairro = bairro
        if (cidade) updateData.cidade = cidade
        if (estado) updateData.estado = estado

        await adminDb.collection('profiles').doc(session.uid).set(updateData, { merge: true })

        revalidatePath('/dashboard-teacher/settings')
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar configurações do professor", error)
        return { success: false, error: 'Erro ao salvar configurações' }
    }
}

export async function getTeacherNotificationsAction() {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        return { success: false, error: 'Não autorizado' }
    }

    try {
        // 1. Busca os cursos do professor logado
        const coursesSnapshot = await adminDb
            .collection('courses')
            .where('teacher_id', '==', session.uid)
            .get()

        const courseMap: Record<string, string> = {}
        const courseIds: string[] = []

        coursesSnapshot.forEach(doc => {
            courseMap[doc.id] = doc.data().title || 'Curso'
            courseIds.push(doc.id)
        })

        if (courseIds.length === 0) {
            return { success: true, notifications: [] }
        }

        // 2. Busca matrículas nos cursos em lotes de 30 para evitar limitações do operador "in"
        const chunks: string[][] = []
        for (let i = 0; i < courseIds.length; i += 30) {
            chunks.push(courseIds.slice(i, i + 30))
        }

        const enrollmentPromises = chunks.map(chunk =>
            adminDb.collection('enrollments')
                .where('course_id', 'in', chunk)
                .where('payment_confirmed', '==', true)
                .orderBy('created_at', 'desc')
                .limit(10)
                .get()
        )

        const enrollmentSnapshots = await Promise.all(enrollmentPromises)
        const enrollments: any[] = []

        enrollmentSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data()
                enrollments.push({
                    id: doc.id,
                    course_id: data.course_id,
                    user_id: data.user_id,
                    created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : (data.created_at || null)
                })
            })
        })

        // 3. Ordena os resultados agregados e limita aos top 10
        enrollments.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
            return dateB - dateA
        })

        const topEnrollments = enrollments.slice(0, 10)

        if (topEnrollments.length === 0) {
            return { success: true, notifications: [] }
        }

        // 4. Busca os nomes dos alunos envolvidos em paralelo (lote de no máximo 10 requisições)
        const studentIds = Array.from(new Set(topEnrollments.map(e => e.user_id)))
        const studentMap: Record<string, string> = {}

        if (studentIds.length > 0) {
            const studentPromises = studentIds.map(id => adminDb.collection('profiles').doc(id).get())
            const studentSnapshots = await Promise.all(studentPromises)
            studentSnapshots.forEach(doc => {
                if (doc.exists) {
                    studentMap[doc.id] = doc.data()?.full_name || 'Aluno'
                } else {
                    studentMap[doc.id] = 'Aluno'
                }
            })
        }

        // 5. Mapeia para o objeto estruturado e serializado
        const notifications = topEnrollments.map(e => {
            const courseTitle = courseMap[e.course_id] || 'Curso'
            const studentName = studentMap[e.user_id] || 'Aluno'
            return {
                id: e.id,
                type: 'sale',
                title: 'Nova venda realizada!',
                subtitle: `Novo Aluno matriculado no curso ${courseTitle}!`,
                time: e.created_at,
                student_name: studentName,
                course_title: courseTitle,
                read: false,
                href: '#'
            }
        })

        return { success: true, notifications }
    } catch (error: any) {
        console.error("Erro ao buscar notificações do professor:", error)
        return { success: false, error: 'Erro interno ao buscar notificações' }
    }
}

