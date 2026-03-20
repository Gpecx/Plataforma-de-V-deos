'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import {
    createPayment,
    createCustomer,
    getPlatformTax,
    getTeacherWalletInfo,
    getCourseInfo,
    getStudentAsaasId,
    calculateSplitValues,
    BillingType,
    PaymentResponse,
    AsaasServiceError,
} from '@/services/asaasService'

export interface CheckoutRequest {
    cursoId: string
    billingType: BillingType
    paymentMethod?: {
        cardNumber?: string
        cardHolderName?: string
        cardExpiryMonth?: string
        cardExpiryYear?: string
        cardCcv?: string
    }
}

export interface CheckoutResponse {
    success: boolean
    paymentId?: string
    invoiceUrl?: string
    pixQrCode?: string
    pixCopiaECola?: string
    status?: string
    error?: string
}

interface SaleLogData {
    idTransacao: string
    alunoId: string
    cursoId: string
    professorId: string
    valorBruto: number
    taxaPlataforma: number
    taxaPlataformaPercent: number
    repasseProfessor: number
    statusPagamento: 'pendente' | 'pago' | 'cancelado'
    dataCriacao: Date
    paymentData?: {
        asaasPaymentId: string
        billingType: BillingType
        dueDate: string
    }
}

export async function processAsaasCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
        const user = await getSessionUser()
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' }
        }

        const { cursoId, billingType } = request

        if (!cursoId || !billingType) {
            return { success: false, error: 'Dados inválidos: cursoId e billingType são obrigatórios' }
        }

        if (!['BOLETO', 'CREDIT_CARD', 'PIX'].includes(billingType)) {
            return { success: false, error: 'Tipo de pagamento inválido' }
        }

        const courseInfo = await getCourseInfo(cursoId)
        if (!courseInfo) {
            return { success: false, error: 'Curso não encontrado' }
        }

        if (courseInfo.price <= 0) {
            return { success: false, error: 'Valor do curso inválido' }
        }

        const teacherWallet = await getTeacherWalletInfo(courseInfo.professorId)
        if (!teacherWallet) {
            return { success: false, error: 'Professor não possui carteira Asaas configurada' }
        }

        const platformTaxPercent = await getPlatformTax()
        const { platformAmount, teacherAmount } = calculateSplitValues(courseInfo.price, platformTaxPercent)

        if (teacherAmount <= 0) {
            return { success: false, error: 'Erro no cálculo do split de pagamento' }
        }

        let customerId = await getStudentAsaasId(user.uid)
        
        if (!customerId) {
            const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
            const profileData = profileDoc.data()

            const newCustomer = await createCustomer({
                name: profileData?.name || profileData?.displayName || 'Aluno',
                email: profileData?.email || user.email || '',
                cpfCnpj: profileData?.cpf || undefined,
                phone: profileData?.phone || undefined,
                externalReference: user.uid,
            })

            customerId = newCustomer.id

            await adminDb.collection('profiles').doc(user.uid).set({
                asaas_customer_id: customerId
            }, { merge: true })
        }

        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 3)
        const dueDateString = dueDate.toISOString().split('T')[0]

        const paymentData = {
            customer: customerId,
            billingType,
            value: courseInfo.price,
            dueDate: dueDateString,
            description: `Compra do curso: ${courseInfo.title}`,
            externalReference: `${user.uid}_${cursoId}`,
            split: {
                container: {
                    splits: [
                        {
                            walletId: teacherWallet.walletId,
                            percent: 100 - platformTaxPercent,
                            amount: teacherAmount,
                        }
                    ]
                }
            }
        }

        const paymentResponse: PaymentResponse = await createPayment(paymentData)

        const saleLog: SaleLogData = {
            idTransacao: paymentResponse.id,
            alunoId: user.uid,
            cursoId,
            professorId: courseInfo.professorId,
            valorBruto: courseInfo.price,
            taxaPlataforma: platformAmount,
            taxaPlataformaPercent: platformTaxPercent,
            repasseProfessor: teacherAmount,
            statusPagamento: 'pendente',
            dataCriacao: new Date(),
            paymentData: {
                asaasPaymentId: paymentResponse.id,
                billingType,
                dueDate: dueDateString,
            }
        }

        await adminDb.collection('vendas_logs').add(saleLog)

        return {
            success: true,
            paymentId: paymentResponse.id,
            invoiceUrl: paymentResponse.invoiceUrl,
            status: paymentResponse.status,
            pixQrCode: paymentResponse.pixTransaction || undefined,
        }

    } catch (error) {
        console.error('Erro no processAsaasCheckout:', error)
        
        if (error instanceof AsaasServiceError) {
            return { success: false, error: error.message }
        }
        
        return { success: false, error: 'Erro interno ao processar pagamento' }
    }
}

export async function getCheckoutData(cursoId: string) {
    try {
        const courseInfo = await getCourseInfo(cursoId)
        if (!courseInfo) {
            return { success: false, error: 'Curso não encontrado' }
        }

        const platformTaxPercent = await getPlatformTax()
        const { platformAmount, teacherAmount } = calculateSplitValues(courseInfo.price, platformTaxPercent)

        const teacherWallet = await getTeacherWalletInfo(courseInfo.professorId)

        return {
            success: true,
            data: {
                curso: {
                    id: courseInfo.id,
                    title: courseInfo.title,
                    price: courseInfo.price,
                },
                split: {
                    platformTaxPercent,
                    platformAmount,
                    teacherAmount,
                    teacherConfigured: !!teacherWallet,
                },
                billingTypes: ['PIX', 'BOLETO', 'CREDIT_CARD'],
            }
        }
    } catch (error) {
        console.error('Erro ao buscar dados do checkout:', error)
        return { success: false, error: 'Erro ao buscar dados do checkout' }
    }
}
