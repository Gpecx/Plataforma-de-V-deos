import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getPayment } from '@/services/asaasService'
import { sendCourseReleasedEmail, sendNewSaleEmail } from '@/lib/mail'

interface AsaasWebhookPayload {
    event: string
    payment: {
        id: string
        customer: string
        billingType: string
        value: number
        status: string
        externalReference?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        // Comparação constant-time para evitar timing attack na descoberta do token.
        // timingSafeEqual exige buffers do mesmo tamanho — daí a checagem de length antes.
        const receivedToken = request.headers.get('asaas-access-token') || ''
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN || ''
        const tokensMatch = expectedToken.length > 0
            && receivedToken.length === expectedToken.length
            && timingSafeEqual(Buffer.from(receivedToken), Buffer.from(expectedToken))

        if (!tokensMatch) {
            console.error('Webhook Asaas: Token inválido ou ausente')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload: AsaasWebhookPayload = await request.json()

        if (!payload.event || !payload.payment?.id) {
            // LGPD: não logar o payload inteiro (contém customer e externalReference). Só campos não-PII.
            console.error('Webhook Asaas: Payload inválido', { event: payload?.event, paymentId: payload?.payment?.id, status: payload?.payment?.status })
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const { event, payment } = payload

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            // A-04: Validação cruzada com a API do Asaas.
            // Se a consulta falhar (timeout/rate-limit), usa como fallback o status do próprio payload
            // para não travar a conciliação automática.
            let asaasPayment = null
            try {
                asaasPayment = await getPayment(payment.id)
            } catch (err) {
                console.warn(`Webhook Asaas: Consulta à API falhou para ${payment.id}, usando fallback do payload.`, err)
            }
            const confirmedStatuses = ['RECEIVED', 'CONFIRMED']
            const isConfirmed = asaasPayment
                ? confirmedStatuses.includes(asaasPayment.status)
                : confirmedStatuses.includes(payment.status)
            if (!isConfirmed) {
                const statusForLog = asaasPayment?.status ?? payment.status
                console.error(`Webhook Asaas: Status não confirmado (${statusForLog}) para o evento ${event}`)
                return NextResponse.json({ error: 'Integrity check failed' }, { status: 400 })
            }
            const invoiceUrl = asaasPayment?.invoiceUrl || null

            // 1. Busca todas as linhas de vendas_logs com este paymentId (pode ser compra multi-curso)
            const vendasLogsQuery = await adminDb.collection('vendas_logs')
                .where('paymentId', '==', payment.id)
                .get()

            if (vendasLogsQuery.empty) {
                console.error(`Webhook Asaas: Nenhuma venda encontrada para paymentId ${payment.id}`)
                return NextResponse.json({ success: true, message: 'Venda não encontrada, ignorando.' }, { status: 200 })
            }

            // 2. Idempotência: verifica se ao menos um já foi processado
            const alreadyProcessed = vendasLogsQuery.docs.some(d => d.data().statusPagamento === 'pago')
            if (alreadyProcessed) {
                return NextResponse.json({ success: true, message: 'Já processado.' }, { status: 200 })
            }

            // 3. Confirma cada venda e atualiza o enrollment correspondente
            const batch = adminDb.batch()
            const emailQueue: { userId: string; cursoId: string; professorId: string }[] = []

            for (const saleDoc of vendasLogsQuery.docs) {
                const saleData = saleDoc.data()
                const userId: string = saleData.userId || saleData.alunoId
                const cursoId: string = saleData.cursoId
                const professorId: string = saleData.professorId

                // Marca a venda como paga
                batch.update(saleDoc.ref, {
                    statusPagamento: 'pago',
                    paymentDate: FieldValue.serverTimestamp(),
                    invoiceUrl: invoiceUrl || saleData.invoiceUrl || null,
                })

                // Confirma o enrollment (muda status para ativo)
                let enrollmentQuery = await adminDb.collection('enrollments')
                    .where('payment_id', '==', payment.id)
                    .where('course_id', '==', cursoId)
                    .limit(1)
                    .get()

                // Fallback: se o webhook chegou antes do payment_id ser atualizado,
                // busca pelo par user_id + course_id (enrollment foi criado antes do Asaas)
                if (enrollmentQuery.empty && userId && cursoId) {
                    enrollmentQuery = await adminDb.collection('enrollments')
                        .where('user_id', '==', userId)
                        .where('course_id', '==', cursoId)
                        .limit(1)
                        .get()
                }

                if (!enrollmentQuery.empty) {
                    const enrollmentRef = enrollmentQuery.docs[0].ref
                    const now = new Date()
                    batch.update(enrollmentRef, {
                        payment_confirmed: true,
                        payment_id: payment.id,
                        purchasedAt: now,
                        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                        updated_at: FieldValue.serverTimestamp(),
                        paid_at: now,
                        status: 'active'
                    })

                    // Remove da lista de desejos, se existir
                    const wishlistRef = adminDb.collection('profiles').doc(userId).collection('wishlist').doc(cursoId)
                    batch.delete(wishlistRef)

                    emailQueue.push({ userId, cursoId, professorId })
                } else {
                    console.warn(`Webhook Asaas: Tentativa de confirmar matrícula inexistente (curso ${cursoId})`)
                }
            }

            await batch.commit()

            // Dispara e-mails após o commit
            if (emailQueue.length > 0) {
                const uniqueStudentIds = [...new Set(emailQueue.map(e => e.userId))]
                const uniqueStudentId = uniqueStudentIds[0]
                const firstEntry = emailQueue[0]

                const [studentProfile, courseDoc] = await Promise.all([
                    adminDb.collection('profiles').doc(uniqueStudentId).get(),
                    adminDb.collection('courses').doc(firstEntry.cursoId).get(),
                ])

                const studentData = studentProfile.data()
                const courseData = courseDoc.data()
                const studentName = studentData?.full_name || studentData?.name || studentData?.displayName || 'Aluno'
                const courseName = courseData?.title || 'Curso'

                if (studentData?.email) {
                    await sendCourseReleasedEmail({
                        studentEmail: studentData.email,
                        studentName,
                        courseName,
                        courseId: firstEntry.cursoId,
                    })
                }

                // Notifica cada professor envolvido
                const uniqueTeacherIds = [...new Set(emailQueue.map(e => e.professorId).filter(Boolean))]
                for (const teacherId of uniqueTeacherIds) {
                    const teacherProfile = await adminDb.collection('profiles').doc(teacherId).get()
                    const teacherData = teacherProfile.data()
                    if (teacherData?.email) {
                        const teacherName = teacherData.full_name || teacherData.name || teacherData.displayName || 'Professor'
                        const teacherCourses = emailQueue.filter(e => e.professorId === teacherId)
                        const courseNames = await Promise.all(
                            teacherCourses.map(e =>
                                adminDb.collection('courses').doc(e.cursoId).get()
                                    .then(d => d.data()?.title || 'Curso')
                            )
                        )
                        // Para simplificar, notifica sobre o primeiro curso da venda
                        await sendNewSaleEmail({
                            teacherEmail: teacherData.email,
                            teacherName,
                            studentName,
                            courseName: courseNames[0] || courseName,
                        })
                    }
                }
            }

        } else {
            // Eventos ignorados não precisam ser logados em produção
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        // LGPD: logar só a mensagem — o objeto de erro pode carregar PII do payload.
        console.error('Webhook Asaas: Erro ao processar webhook:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
