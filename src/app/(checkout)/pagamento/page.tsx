"use client"

import { useCartStore } from '@/store/useCartStore'
import {
    CreditCard,
    QrCode,
    ReceiptText,
    ShieldCheck,
    Lock,
    ArrowLeft,
    XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { processCheckoutAction, getProfile, getLatestCoursePrices } from '@/app/(app)/dashboard-student/actions'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type PaymentMethod = 'credit_card' | 'pix' | 'boleto'
type BillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

interface UserProfile {
    cpf_cnpj?: string
    cpf?: string
    email?: string
    phone?: string
    cep?: string
    numero?: string
    numero_endereco?: string
}

interface CoursePrice {
    id: string
    price: number
}

function maskCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function maskExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
}

function maskCvc(value: string): string {
    return value.replace(/\D/g, '').slice(0, 4)
}

function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

function maskCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5)
    return digits
}

function detectCardBrand(number: string): string {
    const cleaned = number.replace(/\D/g, '')
    if (/^4/.test(cleaned)) return 'Visa'
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
    if (/^3[47]/.test(cleaned)) return 'Amex'
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover'
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'Diners'
    if (/^2(?:014|149)/.test(cleaned)) return 'Elo'
    return ''
}

export default function PagamentoPage() {
    const { items, getTotal, clearCart, showNotification, syncPrices } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const hasTriggeredRedirect = useRef(false)
    const [checkoutTotal, setCheckoutTotal] = useState(0)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card')
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [isLoadingPrices, setIsLoadingPrices] = useState(true)
    const [paymentError, setPaymentError] = useState<string | null>(null)
    const [isFreeLocked, setIsFreeLocked] = useState<boolean | null>(null)
    const fetchIdRef = useRef(0)

    const [cardNumber, setCardNumber] = useState('')
    const [cardHolder, setCardHolder] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvc, setCardCvc] = useState('')
    const [holderCpf, setHolderCpf] = useState('')
    const [holderEmail, setHolderEmail] = useState('')
    const [holderPhone, setHolderPhone] = useState('')
    const [holderCep, setHolderCep] = useState('')
    const [holderAddressNumber, setHolderAddressNumber] = useState('')

    useEffect(() => {
        if (userProfile) {
            if (userProfile.cpf_cnpj || userProfile.cpf) setHolderCpf(userProfile.cpf_cnpj || userProfile.cpf || '')
            if (userProfile.email) setHolderEmail(userProfile.email || '')
            if (userProfile.phone) setHolderPhone(userProfile.phone || '')
            if (userProfile.cep) setHolderCep(userProfile.cep || '')
            if (userProfile.numero || userProfile.numero_endereco) setHolderAddressNumber(userProfile.numero || userProfile.numero_endereco || '')
        }
    }, [userProfile])

    useEffect(() => { setMounted(true) }, [])

    // FIX: dependência corrigida de items.length para items, garantindo que
    // o efeito re-execute quando o conteúdo do array muda (não só o tamanho)
    useEffect(() => {
        if (!mounted) return
        const currentFetchId = ++fetchIdRef.current
        if (items.length === 0 && !hasTriggeredRedirect.current) {
            hasTriggeredRedirect.current = true
            router.push('/course')
            return
        }
        hasTriggeredRedirect.current = true
        const fetchData = async () => {
            const profileResult = await getProfile()
            if (fetchIdRef.current !== currentFetchId) return
            if (profileResult.success) setUserProfile(profileResult.data as UserProfile)
            setIsLoadingProfile(false)
            if (items.length > 0) {
                setIsLoadingPrices(true)
                const priceResult = await getLatestCoursePrices(items.map(i => i.id))
                if (fetchIdRef.current !== currentFetchId) return
                if (priceResult.success && priceResult.data) syncPrices(priceResult.data as CoursePrice[])
                const total = getTotal()
                setCheckoutTotal(total)
                setIsFreeLocked(total === 0)
                setIsLoadingPrices(false)
            } else {
                setIsLoadingPrices(false)
            }
        }
        fetchData()
    }, [mounted, items, router, syncPrices, getTotal])

    useEffect(() => {
        if (selectedMethod !== 'credit_card') setPaymentError(null)
    }, [selectedMethod])

    if (!mounted) return null

    const isFree = isFreeLocked ?? (checkoutTotal > 0 ? false : getTotal() === 0)
    const cardBrand = detectCardBrand(cardNumber)

    const validateCardForm = (): string | null => {
        const cleanedNumber = cardNumber.replace(/\s/g, '')
        if (cleanedNumber.length < 13) return 'Número do cartão inválido.'
        const nameParts = cardHolder.trim().split(' ')
        if (nameParts.length < 2 || !cardHolder.trim()) return 'Informe o nome completo do titular como está no cartão.'
        const expiryDigits = cardExpiry.replace(/\D/g, '')
        if (expiryDigits.length !== 4) return 'Data de expiração inválida.'
        const expMonth = parseInt(expiryDigits.slice(0, 2))
        const expYear = parseInt('20' + expiryDigits.slice(2))
        if (expMonth < 1 || expMonth > 12) return 'Mês de expiração inválido.'
        const now = new Date()
        const expDate = new Date(expYear, expMonth)
        if (expDate <= now) return 'Cartão expirado.'
        if (cardCvc.replace(/\D/g, '').length < 3) return 'CVC inválido.'
        const cpfDigits = holderCpf.replace(/\D/g, '')
        if (cpfDigits.length < 11) return 'CPF/CNPJ do titular inválido.'
        if (!holderEmail.includes('@')) return 'E-mail do titular inválido.'
        const cepDigits = holderCep.replace(/\D/g, '')
        if (cepDigits.length < 8) return 'CEP inválido.'
        if (!holderAddressNumber.trim()) return 'Número do endereço é obrigatório.'
        return null
    }

    const handlePayment = async () => {
        setPaymentError(null)
        if (isFree) {
            setIsProcessing(true)
            try {
                const courseIds = items.flatMap(item => item.course_ids || [item.id])
                const bundleItem = items.find(item => item.bundle_id)
                const bundleData = bundleItem ? { bundle_id: bundleItem.bundle_id!, course_ids: bundleItem.course_ids || [], bundle_price: bundleItem.price } : null
                const result = await processCheckoutAction(courseIds, 'PIX', true, undefined, bundleData)
                if (!result.success) { setPaymentError(result.error || "Erro ao liberar acesso gratuito"); setIsProcessing(false); return }
                clearCart()
                window.location.href = '/dashboard-student'
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Erro ao liberar acesso gratuito"
                console.error(error); setPaymentError(message); setIsProcessing(false)
            }
            return
        }
        if (!termsAccepted) { showNotification('Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.', 'error'); return }
        const hasCep = userProfile?.cep && userProfile?.numero
        if (!hasCep && (selectedMethod === 'pix' || selectedMethod === 'boleto')) {
            showNotification('Para pagamentos via PIX ou Boleto, você precisa cadastrar seu CEP e Número do endereço em Perfil.', 'error'); return
        }
        if (selectedMethod === 'credit_card') {
            const validationError = validateCardForm()
            if (validationError) { setPaymentError(validationError); return }
        }
        setIsProcessing(true)
        try {
            const courseIds = items.flatMap(item => item.course_ids || [item.id])
            const bundleItem = items.find(item => item.bundle_id)
            const bundleData = bundleItem ? { bundle_id: bundleItem.bundle_id!, course_ids: bundleItem.course_ids || [], bundle_price: bundleItem.price } : null
            const methodMap: Record<PaymentMethod, string> = { credit_card: 'CREDIT_CARD', pix: 'PIX', boleto: 'BOLETO' }
            const billingType = methodMap[selectedMethod]
            const cardData = selectedMethod === 'credit_card' ? {
                creditCard: { holderName: cardHolder.trim(), number: cardNumber.replace(/\s/g, ''), expiryMonth: cardExpiry.replace(/\D/g, '').slice(0, 2), expiryYear: '20' + cardExpiry.replace(/\D/g, '').slice(2, 4), ccv: cardCvc.replace(/\D/g, '') },
                creditCardHolderInfo: { name: cardHolder.trim(), email: holderEmail.trim(), cpfCnpj: holderCpf.replace(/\D/g, ''), postalCode: holderCep.replace(/\D/g, ''), addressNumber: holderAddressNumber.trim(), phone: holderPhone.replace(/\D/g, '') || undefined }
            } : undefined
            const result = await processCheckoutAction(courseIds, billingType as BillingType, termsAccepted, cardData, bundleData)
            if (!result.success) { setPaymentError(result.error || "Erro ao processar pagamento"); setIsProcessing(false); return }
            if (result.data) {
                const { paymentId, billingType: respBillingType, invoiceUrl } = result.data
                clearCart()
                if (respBillingType === 'CREDIT_CARD') { window.location.href = `/pagamento/sucesso?id=${paymentId}&type=${respBillingType}`; return }
                if (respBillingType === 'PIX' || respBillingType === 'BOLETO') { window.location.href = `/pagamento/sucesso?id=${paymentId}&type=${respBillingType}`; return }
                if (invoiceUrl) { window.location.href = invoiceUrl; return }
            }
            clearCart()
            window.location.href = '/dashboard-student'
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro fatal no pagamento. Tente novamente."
            console.error(error); setPaymentError(message); setIsProcessing(false)
        }
    }

    const inputBase = "w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all rounded-xl"
    const inputMono = inputBase + " font-mono"
    const labelBase = "block text-sm font-semibold mb-1.5"
    const labelStyle = { color: '#374151' }

    return (
        <div className="min-h-screen bg-[#F0F2F5] text-gray-900 font-montserrat mb-20">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">

                {/* Voltar */}
                <div className="mb-10">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1D5F31] transition-colors group">
                        <div className="p-2 border border-gray-300 rounded-lg group-hover:border-[#1D5F31] transition-colors bg-white">
                            <ArrowLeft size={16} className="text-gray-600 group-hover:text-[#1D5F31]" />
                        </div>
                        Voltar ao Carrinho
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

                    {/* Coluna Esquerda */}
                    <div className="lg:col-span-8 space-y-8">

                        <div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>
                                {isFree ? 'Confirme sua inscrição gratuita' : 'Escolha sua forma de pagamento'}
                            </h1>
                            <p className="text-sm" style={{ color: '#6b7280' }}>
                                {isFree
                                    ? 'Você está adquirindo um treinamento gratuito. Clique no botão ao lado para liberar seu acesso imediatamente.'
                                    : 'Selecione o método de sua preferência para concluir a inscrição.'}
                            </p>
                        </div>

                        {/* Aviso CPF */}
                        {!isFree && mounted && !isLoadingProfile && (!userProfile?.cpf_cnpj && !userProfile?.cpf) && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                                <div className="flex gap-4">
                                    <div className="bg-amber-100 p-2 rounded-lg h-fit text-amber-600"><ShieldCheck size={22} /></div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm !text-amber-900">Ação Necessária: Cadastro de CPF</h3>
                                        <p className="text-xs !text-amber-800 leading-relaxed">Para sua segurança e conformidade com a emissão de notas fiscais, o Asaas exige um CPF ou CNPJ vinculado à sua conta.</p>
                                        <Link href="/dashboard-student/profile" className="inline-block text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-4 pt-1">Cadastrar agora no meu perfil →</Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Aviso Endereço */}
                        {!isFree && mounted && !isLoadingProfile && (!userProfile?.cep || !userProfile?.numero) && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                                <div className="flex gap-4">
                                    <div className="bg-amber-100 p-2 rounded-lg h-fit text-amber-600"><ShieldCheck size={22} /></div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm !text-amber-900">Ação Necessária: Cadastro de Endereço</h3>
                                        <p className="text-xs !text-amber-800 leading-relaxed">Para pagamentos via PIX ou Boleto, é necessário cadastrar o CEP e o Número do endereço em seu perfil.</p>
                                        <Link href="/dashboard-student/profile" className="inline-block text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-4 pt-1">Cadastrar agora no meu perfil →</Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Métodos de pagamento */}
                        {!isFree && (
                            <div className="space-y-3">
                                {/* Cartão de Crédito */}
                                <div
                                    onClick={() => setSelectedMethod('credit_card')}
                                    className={cn(
                                        "p-5 cursor-pointer transition-all duration-200 flex items-center justify-between group rounded-xl",
                                        selectedMethod === 'credit_card'
                                            ? "border-2 border-green-500 bg-green-50/40 shadow-sm"
                                            : "border border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl transition-colors", selectedMethod === 'credit_card' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500")}>
                                            <CreditCard size={22} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="font-semibold text-base" style={{ color: '#111827' }}>Cartão de Crédito</h3>
                                            <p className="text-sm" style={{ color: '#6b7280' }}>Aprovação imediata • Parcelamento em até 12x</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <svg viewBox="0 0 48 32" className="h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1A1F71" /><path d="M19.5 21.5C20.375 20.625 18.75 20 18 19.5C16.5 18.75 15.5 18.125 14.25 17.5C13.125 16.937 12 16.625 10.875 16.625C9.6875 16.625 8.5625 17 7.5625 17.625C6.125 18.5 5.375 19.6875 5.375 21.125C5.375 22.3125 5.9375 23.3125 7.0625 24.0625C8.1875 24.8125 9.6875 25.25 11.5625 25.25C12.8125 25.25 14 25 15.0625 24.5625C16.1875 24.0625 17.1875 23.375 17.8125 22.5L19.5 21.5Z" fill="white" /></svg>
                                        <svg viewBox="0 0 48 32" className="h-6" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#EB001B" /><circle cx="17" cy="16" r="10" fill="#EB001B" /><circle cx="31" cy="16" r="10" fill="#F79E1B" /></svg>
                                    </div>
                                </div>

                                {/* PIX */}
                                <div
                                    onClick={() => setSelectedMethod('pix')}
                                    className={cn(
                                        "p-5 cursor-pointer transition-all duration-200 flex items-center justify-between group rounded-xl",
                                        selectedMethod === 'pix'
                                            ? "border-2 border-green-500 bg-green-50/40 shadow-sm"
                                            : "border border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl transition-colors", selectedMethod === 'pix' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500")}>
                                            <QrCode size={22} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="font-semibold text-base" style={{ color: '#111827' }}>PIX</h3>
                                            <p className="text-sm" style={{ color: '#6b7280' }}>Liberação instantânea • Desconto progressivo</p>
                                        </div>
                                    </div>
                                    <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Instantâneo</span>
                                </div>

                                {/* Boleto */}
                                <div
                                    onClick={() => setSelectedMethod('boleto')}
                                    className={cn(
                                        "p-5 cursor-pointer transition-all duration-200 flex items-center justify-between group rounded-xl",
                                        selectedMethod === 'boleto'
                                            ? "border-2 border-green-500 bg-green-50/40 shadow-sm"
                                            : "border border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl transition-colors", selectedMethod === 'boleto' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500")}>
                                            <ReceiptText size={22} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="font-semibold text-base" style={{ color: '#111827' }}>Boleto Bancário</h3>
                                            <p className="text-sm" style={{ color: '#6b7280' }}>Compensação em até 48 horas úteis</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Formulário Cartão */}
                        {!isFree && selectedMethod === 'credit_card' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">

                                <div className="pb-4 border-b border-gray-100">
                                    <h3 className="text-base font-bold" style={{ color: '#111827' }}>Dados do Cartão</h3>
                                    <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Insira as informações do seu cartão de crédito</p>
                                </div>

                                <div>
                                    <label className={labelBase} style={labelStyle}>Número do Cartão</label>
                                    <div className="relative">
                                        <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(maskCardNumber(e.target.value))} maxLength={19} className={inputMono} />
                                        {cardBrand && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-700">{cardBrand}</span>}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelBase} style={labelStyle}>Nome do Titular (como está no cartão)</label>
                                    <input type="text" placeholder="NOME IMPRESSO NO CARTÃO" value={cardHolder} onChange={e => setCardHolder(e.target.value.toUpperCase())} className={inputBase + " uppercase"} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelBase} style={labelStyle}>Data de Expiração</label>
                                        <input type="text" inputMode="numeric" placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(maskExpiry(e.target.value))} maxLength={5} className={inputMono} />
                                    </div>
                                    <div>
                                        <label className={labelBase} style={labelStyle}>CVC</label>
                                        <input type="text" inputMode="numeric" placeholder="123" value={cardCvc} onChange={e => setCardCvc(maskCvc(e.target.value))} maxLength={4} className={inputMono} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-base font-bold mb-1" style={{ color: '#111827' }}>Dados do Titular</h3>
                                    <p className="text-sm mb-6" style={{ color: '#6b7280' }}>CPF/CNPJ, CEP e número são preenchidos automaticamente do seu perfil.</p>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelBase} style={labelStyle}>CPF / CNPJ</label>
                                                <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={maskCpf(holderCpf)} onChange={e => setHolderCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={14} className={inputMono} />
                                            </div>
                                            <div>
                                                <label className={labelBase} style={labelStyle}>E-mail</label>
                                                <input type="email" placeholder="seu@email.com" value={holderEmail} onChange={e => setHolderEmail(e.target.value)} className={inputBase} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelBase} style={labelStyle}>Telefone</label>
                                            <input type="text" inputMode="numeric" placeholder="(11) 99999-9999" value={maskPhone(holderPhone)} onChange={e => setHolderPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={15} className={inputMono} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelBase} style={labelStyle}>CEP</label>
                                                <input type="text" inputMode="numeric" placeholder="00000-000" value={maskCep(holderCep)} onChange={e => setHolderCep(e.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={9} className={inputMono} />
                                            </div>
                                            <div>
                                                <label className={labelBase} style={labelStyle}>Número</label>
                                                <input type="text" placeholder="123" value={holderAddressNumber} onChange={e => setHolderAddressNumber(e.target.value)} className={inputBase} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {paymentError && (
                                    <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 p-4 flex items-start gap-3 rounded-xl mt-2">
                                        <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold !text-red-800">Erro no Pagamento</h4>
                                            <p className="text-sm !text-red-700 mt-0.5 leading-relaxed">{paymentError}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isFree && (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <ShieldCheck size={18} />
                                    <p className="text-sm !text-gray-500">Pague com segurança através do Asaas. Seus dados estão protegidos.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coluna Direita — Resumo */}
                    <aside className="lg:col-span-4 relative">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-32 flex flex-col h-fit">

                            <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#9ca3af' }}>Resumo do Pedido</h2>

                            <div className="space-y-5 mb-6 max-h-[300px] overflow-y-auto pr-1">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center">
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0 relative">
                                            {/* FIX: substituído <img> por <Image /> do Next.js para otimização automática */}
                                            <Image
                                                src={item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                                                fill
                                                className="object-cover"
                                                alt={item.title}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{item.title}</h4>
                                            {item.bundle_id && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1 border border-amber-200">PACOTE</span>
                                            )}
                                            <span className="text-sm font-bold text-gray-900 block mt-0.5">
                                                {isLoadingPrices ? <span className="animate-pulse text-gray-400">Carregando...</span> : (item.price === 0 ? 'Gratuito' : `R$ ${item.price.toFixed(2)}`)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gray-100 mb-6" />

                            {!isFree && (
                                <div className="mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5">
                                            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="sr-only" />
                                            <div className={`w-5 h-5 border-2 transition-all rounded-md flex items-center justify-center ${termsAccepted ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                                                {termsAccepted && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-600 leading-relaxed">
                                            Li e aceito os{' '}
                                            <a href="/termos" target="_blank" className="text-green-600 font-semibold hover:underline">Termos de Uso</a>,{' '}
                                            <a href="/privacidade" target="_blank" className="text-green-600 font-semibold hover:underline">Privacidade</a>{' '}
                                            e a{' '}
                                            <a href="/dashboard-student/refund-policy" target="_blank" className="text-green-600 font-semibold hover:underline">Política de Reembolso</a>.
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm" style={{ color: '#4b5563' }}>
                                    <span>Subtotal</span>
                                    <span className="font-semibold" style={{ color: '#111827' }}>{isFree ? 'Grátis' : `R$ ${(checkoutTotal > 0 ? checkoutTotal : getTotal()).toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold" style={{ color: '#374151' }}>Total Final</span>
                                    <div className="text-2xl font-bold" style={{ color: '#111827' }}>
                                        {isFree ? 'Gratuito' : checkoutTotal > 0 ? `R$ ${checkoutTotal.toFixed(2)}` : isLoadingPrices ? <div className="h-8 w-28 bg-gray-100 animate-pulse rounded" /> : `R$ ${getTotal().toFixed(2)}`}
                                    </div>
                                </div>
                            </div>

                            {!isFree && !isLoadingProfile && !userProfile?.cpf_cnpj && !userProfile?.cpf ? (
                                <button onClick={() => router.push('/dashboard-student/profile')} className="w-full py-4 bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] rounded-xl font-semibold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    CADASTRAR CPF PARA PAGAR →
                                </button>
                            ) : (
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || isLoadingProfile || (!isFree && !termsAccepted)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2",
                                        (isProcessing || isLoadingProfile || (!isFree && !termsAccepted))
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-sm'
                                    )}
                                >
                                    {isProcessing ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</>
                                    ) : (
                                        isFree ? 'CONCLUIR INSCRIÇÃO GRATUITA →' : 'CONFIRMAR PAGAMENTO →'
                                    )}
                                </button>
                            )}

                            {!isFree && (
                                <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Lock size={14} className="text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-500">Checkout Seguro</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-500">Proteção de Dados</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}