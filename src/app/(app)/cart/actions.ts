'use server'

import { adminDb } from '@/lib/firebase-admin'

/**
 * Valida se os itens no carrinho ainda existem no banco de dados e se estão aprovados.
 * Retorna apenas os IDs que são válidos.
 */
export async function validateCartItemsAction(courseIds: string[]) {
    if (!courseIds || courseIds.length === 0) return { validIds: [] }

    try {
        const validIds: string[] = []
        
        // O limite do "in" no Firestore é de 30 IDs por consulta
        const chunks = []
        for (let i = 0; i < courseIds.length; i += 30) {
            chunks.push(courseIds.slice(i, i + 30))
        }

        for (const chunk of chunks) {
            const snapshot = await adminDb.collection('courses')
                .where('__name__', 'in', chunk)
                .where('status', '==', 'APROVADO')
                .get()
            
            snapshot.docs.forEach(doc => {
                validIds.push(doc.id)
            })
        }

        return { validIds }
    } catch (error) {
        console.error('[validateCartItemsAction] Erro:', error)
        return { error: 'Falha ao validar integridade do carrinho.' }
    }
}
