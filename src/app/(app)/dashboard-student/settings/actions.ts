"use server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function deleteAccount() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value

    if (!token) {
        return { success: false, error: "Não autorizado" }
    }

    let decodedToken
    try {
        decodedToken = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        return { success: false, error: "Token inválido" }
    }

    const uid = decodedToken.uid

    try {
        // 1. Deletar matrículas (enrollments)
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', uid)
            .get()

        const batch = adminDb.batch()
        enrollmentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })

        // 2. Deletar documento de perfil
        batch.delete(adminDb.collection('profiles').doc(uid))

        // 3. Executar batch de deleção no Firestore
        await batch.commit()

        // 4. Deletar usuário do Firebase Auth
        await adminAuth.deleteUser(uid)

        // 5. Limpar cookies
        const responseCookies = await cookies()
        responseCookies.delete('session')
        responseCookies.delete('active_session_id')

    } catch (error: any) {
        console.error("Erro ao deletar conta:", error)
        return { success: false, error: error.message || "Erro desconhecido ao deletar conta" }
    }

    // Redireciona para fora após sucesso
    redirect("/login?message=conta_excluida")
}
