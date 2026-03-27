import { adminDb } from '@/lib/firebase-admin'

function getAsaasApiBaseUrl(): string {
    const url = process.env.ASAAS_API_URL
    if (!url) {
        return 'https://sandbox.asaas.com/api/v3'
    }
    return url
}

const ASAAS_API_BASE_URL = getAsaasApiBaseUrl()

export type BillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX'

export interface SplitRecipient {
    walletId: string
    percent: number
    amount: number
    fixedValue?: number
}

export interface SplitConfig {
    container: {
        splits: SplitRecipient[]
    }
}

export interface PaymentRequest {
    customer: string
    billingType: BillingType
    value: number
    dueDate: string
    description?: string
    externalReference?: string
    split?: SplitConfig
}

export interface PaymentResponse {
    id: string
    customer: string
    billingType: BillingType
    value: number
    netValue: number
    grossValue: number
    dueDate: string
    originalDueDate: string
    paymentDate: string | null
    dateCreated: string
    status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED'
    externalReference: string | null
    description: string | null
    pixTransaction: string | null
    encryptedCard: string | null
    installmentNumber: number | null
    invoiceUrl: string
    invoiceId: string
    creditCardBrand: string | null
    creditCardNumber: string | null
    deleted: boolean
    refunded: boolean
}

export interface CustomerResponse {
    id: string
    name: string
    email: string
    cpfCnpj: string
    phone: string
    mobilePhone: string
    address: string
       addressNumber: string
    complement: string
    province: string
    postalCode: string
    city: number
    state: string
    country: string
    deleted: boolean
    additionalEmails: string
    mutable: boolean
    gatewayAffiliationId: string | null
    externalReference: string | null
    notificationDisabled: boolean
    automaticIncidentNotificationDisabled: boolean
    creditCard: boolean
    boleto: boolean
    pix: boolean
    createdAt: string
    updatedAt: string
    object: string
}

export interface ApiError {
    code: string
    description: string
    moreInfo: string
}

export class AsaasServiceError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number
    ) {
        super(message)
        this.name = 'AsaasServiceError'
    }
}

function getAsaasApiKey(): string {
    const apiKey = process.env.ASAAS_API_KEY
    if (!apiKey) {
        throw new AsaasServiceError('ASAAS_API_KEY não configurada nas variáveis de ambiente')
    }
    return apiKey
}

async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const apiKey = getAsaasApiKey()
    
    const response = await fetch(`${ASAAS_API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
            ...options.headers,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        // Log detalhado para depuração conforme solicitado no requisito
        console.error("ERRO ASAAS DATA:", data);
        console.error("STATUS ASAAS:", response.status);

        const errors = (data.errors || (Array.isArray(data) ? data : [])) as ApiError[]
        const errorMessage = errors.length > 0
            ? errors.map(e => e.description).join(', ') 
            : 'Erro desconhecido'
        throw new AsaasServiceError(errorMessage, undefined, response.status)
    }

    return data as T
}

export async function createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    return makeRequest<PaymentResponse>('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
    })
}

export interface PixQrCodeResponse {
    success: boolean
    encodedImage: string
    payload: string
    expirationDate: string
}

export async function getPaymentQrCode(paymentId: string): Promise<PixQrCodeResponse> {
    return makeRequest<PixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`)
}

export interface IdentificationFieldResponse {
    identificationField: string
    nossoNumero: string
    barCode: string
}

export async function getPaymentIdentification(paymentId: string): Promise<IdentificationFieldResponse> {
    return makeRequest<IdentificationFieldResponse>(`/payments/${paymentId}/identificationField`)
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
    return makeRequest<PaymentResponse>(`/payments/${paymentId}`)
}

export async function getCustomer(customerId: string): Promise<CustomerResponse> {
    return makeRequest<CustomerResponse>(`/customers/${customerId}`)
}

export async function getPlatformTax(): Promise<number> {
    const doc = await adminDb.collection('config').doc('platform_settings').get()
    
    if (!doc.exists) {
        return 20
    }
    
    const data = doc.data()
    return data?.platform_tax ?? 20
}

export interface TeacherWalletInfo {
    teacherId: string
    walletId: string
    name: string
}

export async function getTeacherWalletInfo(professorId: string): Promise<TeacherWalletInfo | null> {
    const profileDoc = await adminDb.collection('profiles').doc(professorId).get()
    
    if (!profileDoc.exists) {
        return null
    }
    
    const data = profileDoc.data()
    const walletId = data?.asaas_wallet_id || data?.walletId
    
    if (!walletId) {
        return null
    }
    
    return {
        teacherId: professorId,
        walletId,
        name: data?.name || data?.displayName || 'Professor'
    }
}

export interface CourseInfo {
    id: string
    title: string
    price: number
    professorId: string
}

export async function getCourseInfo(cursoId: string): Promise<CourseInfo | null> {
    const courseDoc = await adminDb.collection('courses').doc(cursoId).get()
    
    if (!courseDoc.exists) {
        return null
    }
    
    const data = courseDoc.data()
    return {
        id: courseDoc.id,
        title: data?.title || data?.shortTitle || 'Curso',
        price: data?.price || 0,
        professorId: data?.professorId || data?.instructorId || ''
    }
}

export interface StudentInfo {
    studentId: string
    email: string
    name: string
    cpfCnpj?: string
    phone?: string
}

export async function getStudentAsaasId(alunoId: string): Promise<string | null> {
    const profileDoc = await adminDb.collection('profiles').doc(alunoId).get()
    
    if (!profileDoc.exists) {
        return null
    }
    
    const data = profileDoc.data()
    return data?.asaas_customer_id || null
}

export interface CreateCustomerRequest {
    name: string
    email: string
    cpfCnpj?: string
    phone?: string
    mobilePhone?: string
    postalCode?: string
    address?: string
    addressNumber?: string
    complement?: string
    province?: string
    city?: number
    state?: string
    externalReference?: string
}

export async function createCustomer(customerData: CreateCustomerRequest): Promise<CustomerResponse> {
    return makeRequest<CustomerResponse>('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
    })
}

export function calculateSplitValues(
    grossValue: number,
    platformTaxPercent: number
): { platformAmount: number; teacherAmount: number } {
    const platformAmount = Math.round(grossValue * (platformTaxPercent / 100) * 100) / 100
    const teacherAmount = Math.round((grossValue - platformAmount) * 100) / 100
    
    return { platformAmount, teacherAmount }
}
