import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

/**
 * LGPD — Limpeza periódica de dados de consentimento expirados (retenção: 24 meses).
 *
 * Protegida por CRON_SECRET (header Authorization: Bearer <secret>). Deve ser
 * chamada por um agendador externo (Vercel Cron / GitHub Actions) a cada ~30 dias.
 *
 * Ações:
 *  - profiles: onde consent_log.consent_expires_at < agora → remove APENAS o campo
 *    consent_log.ip_address (mantém o perfil e o restante do registro de consentimento).
 *  - consent_logs: onde consent_expires_at < agora → deleta o documento inteiro
 *    (são logs de auditoria com prazo de retenção).
 *
 * Commits em lotes de 400 operações para respeitar o limite de 500 do Firestore.
 */
async function commitInChunks(
    items: { ref: FirebaseFirestore.DocumentReference; data: any; op: 'update' | 'delete' }[]
): Promise<number> {
    let processed = 0
    for (let i = 0; i < items.length; i += 400) {
        const batch = adminDb.batch()
        const chunk = items.slice(i, i + 400)
        chunk.forEach(item => {
            if (item.op === 'delete') batch.delete(item.ref)
            else batch.update(item.ref, item.data)
        })
        await batch.commit()
        processed += chunk.length
    }
    return processed
}

export async function POST(request: NextRequest) {
    const secret = process.env.CRON_SECRET
    const authHeader = request.headers.get('Authorization')

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const now = new Date()

        // 1. Perfis com consentimento expirado → remove só o IP.
        const profilesSnap = await adminDb.collection('profiles')
            .where('consent_log.consent_expires_at', '<', now)
            .get()

        const cleaned_profiles = await commitInChunks(
            profilesSnap.docs.map(doc => ({
                ref: doc.ref,
                op: 'update' as const,
                data: { 'consent_log.ip_address': FieldValue.delete() },
            }))
        )

        // 2. Logs de consentimento expirados → deleta o documento.
        const logsSnap = await adminDb.collection('consent_logs')
            .where('consent_expires_at', '<', now)
            .get()

        const cleaned_logs = await commitInChunks(
            logsSnap.docs.map(doc => ({ ref: doc.ref, op: 'delete' as const, data: null }))
        )

        return NextResponse.json({ cleaned_profiles, cleaned_logs })
    } catch (error) {
        // LGPD: logar só a mensagem, nunca o objeto (pode conter PII).
        console.error('[cleanup-consent] erro:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Erro interno na limpeza de consentimento' }, { status: 500 })
    }
}
