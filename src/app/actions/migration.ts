'use server'

import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Verifica se o usuário logado é um administrador.
 * Segurança adicional para garantir que o script não seja executado por qualquer um.
 */
async function checkAdmin() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value
    if (!token) return false

    try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true)
        // No PowerPlay, o admin geralmente tem um campo role no profile ou custom claim
        const profileDoc = await adminDb.collection('profiles').doc(decodedToken.uid).get()
        return profileDoc.data()?.role === 'admin'
    } catch (error) {
        return false
    }
}

/**
 * Script de migração de uso único para atualizar status de cursos e vídeos (lessons).
 * Adiciona { status: "APROVADO" } em documentos que ainda não possuem o campo.
 */
export async function runMigration() {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { error: "Acesso negado. Apenas administradores podem executar a migração." }
    }

    try {
        let coursesUpdated = 0
        let lessonsUpdated = 0
        const batch = adminDb.batch()
        let batchCount = 0

        // 1. Migração de Cursos
        const coursesSnap = await adminDb.collection('courses').get()
        coursesSnap.docs.forEach(doc => {
            const data = doc.data()
            if (!data.status) {
                batch.set(doc.ref, { status: 'APROVADO' }, { merge: true })
                coursesUpdated++
                batchCount++
            }
        })

        // 2. Migração de Vídeos (Lessons)
        const lessonsSnap = await adminDb.collection('lessons').get()
        lessonsSnap.docs.forEach(doc => {
            const data = doc.data()
            if (!data.status) {
                batch.set(doc.ref, { status: 'APROVADO' }, { merge: true })
                lessonsUpdated++
                batchCount++
            }
        })

        if (batchCount > 0) {
            // Se houver mais de 500 itens, o Firestore exige múltiplos batches. 
            // Para segurança e simplicidade inicial, processamos até 500 por vez.
            // Se o projeto for muito grande, precisaríamos de uma lógica de chunking mais robusta.
            if (batchCount > 500) {
                return { 
                    error: `Muitos documentos para um único batch (${batchCount}). Por favor, execute a migração em partes ou use uma função de chunking.` 
                }
            }
            await batch.commit()
        }

        revalidatePath('/admin/dashboard')
        revalidatePath('/')

        return { 
            success: true, 
            message: `Migração concluída com sucesso!`,
            details: {
                courses: coursesUpdated,
                lessons: lessonsUpdated,
                total: batchCount
            }
        }
    } catch (error: any) {
        console.error("Erro na migração:", error)
        return { error: `Falha na migração: ${error.message}` }
    }
}
