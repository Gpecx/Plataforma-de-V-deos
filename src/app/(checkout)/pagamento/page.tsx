"use client"

import { useCartStore } from '@/store/useCartStore'
import {
    CreditCard,
    QrCode,
    ReceiptText,
    ShieldCheck,
    Lock,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { processCheckoutAction, getProfile, getLatestCoursePrices } from '@/app/(app)/dashboard-student/actions'
import { cn } from '@/lib/utils'

type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

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
    const [userProfile, setUserProfile] = useState<any>(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [isLoadingPrices, setIsLoadingPrices] = useState(true)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    // Credit card form state
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolder, setCardHolder] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvc, setCardCvc] = useState('')
    const [holderCpf, setHolderCpf] = useState('')
    const [holderEmail, setHolderEmail] = useState('')
    const [holderPhone, setHolderPhone] = useState('')
    const [holderCep, setHolderCep] = useState('')
    const [holderAddressNumber, setHolderAddressNumber] = useState('')

    // Pre-fill from profile when loaded
    useEffect(() => {
        if (userProfile) {
            if (userProfile.cpf_cnpj || userProfile.cpf) {
                setHolderCpf(userProfile.cpf_cnpj || userProfile.cpf || '')
            }
            if (userProfile.email) {
                setHolderEmail(userProfile.email || '')
            }
            if (userProfile.phone) {
                setHolderPhone(userProfile.phone || '')
            }
            if (userProfile.cep) {
                setHolderCep(userProfile.cep || '')
            }
            if (userProfile.numero || userProfile.numero_endereco) {
                setHolderAddressNumber(userProfile.numero || userProfile.numero_endereco || '')
            }
        }
    }, [userProfile])

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        // Só redireciona se o carrinho estiver vazio no mount inicial
        if (items.length === 0 && !hasTriggeredRedirect.current) {
            hasTriggeredRedirect.current = true
            router.push('/course')
            return
        }

        // Bloqueia redirects futuros causados por clearCart durante checkout
        hasTriggeredRedirect.current = true
        
        const fetchData = async () => {
            if (mounted) {
                const profileResult = await getProfile()
                if (profileResult.success) {
                    setUserProfile(profileResult.data)
                }
                setIsLoadingProfile(false)

                if (items.length > 0) {
                    setIsLoadingPrices(true)
                    const priceResult = await getLatestCoursePrices(items.map(i => i.id))
                    if (priceResult.success && priceResult.data) {
                        syncPrices(priceResult.data)
                    }
                    setIsLoadingPrices(false)
                    setCheckoutTotal(getTotal())
                } else {
                    setIsLoadingPrices(false)
                }
            }
        }
        fetchData()
    }, [mounted, items.length, router, syncPrices, isProcessing, getTotal])

    const resetCardForm = useCallback(() => {
        setCardNumber('')
        setCardHolder('')
        setCardExpiry('')
        setCardCvc('')
        setPaymentError(null)
    }, [])

    // Reset card form when switching methods away from credit_card
    useEffect(() => {
        if (selectedMethod !== 'credit_card') {
            setPaymentError(null)
        }
    }, [selectedMethod])

    if (!mounted) return null

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

        if (!termsAccepted) {
            showNotification('Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.', 'error')
            return
        }

        const hasCep = userProfile?.cep && userProfile?.numero
        if (!hasCep && (selectedMethod === 'pix' || selectedMethod === 'boleto')) {
            showNotification('Para pagamentos via PIX ou Boleto, você precisa cadastrar seu CEP e Número do endereço em Perfil.', 'error')
            return
        }

        if (selectedMethod === 'credit_card') {
            const validationError = validateCardForm()
            if (validationError) {
                setPaymentError(validationError)
                return
            }
        }

        setIsProcessing(true)

        try {
            const courseIds = items.map(item => item.id)
            
            const methodMap: Record<PaymentMethod, any> = {
                credit_card: 'CREDIT_CARD',
                pix: 'PIX',
                boleto: 'BOLETO'
            }

            const billingType = methodMap[selectedMethod]

            const cardData = selectedMethod === 'credit_card' ? {
                creditCard: {
                    holderName: cardHolder.trim(),
                    number: cardNumber.replace(/\s/g, ''),
                    expiryMonth: cardExpiry.replace(/\D/g, '').slice(0, 2),
                    expiryYear: '20' + cardExpiry.replace(/\D/g, '').slice(2, 4),
                    ccv: cardCvc.replace(/\D/g, ''),
                },
                creditCardHolderInfo: {
                    name: cardHolder.trim(),
                    email: holderEmail.trim(),
                    cpfCnpj: holderCpf.replace(/\D/g, ''),
                    postalCode: holderCep.replace(/\D/g, ''),
                    addressNumber: holderAddressNumber.trim(),
                    phone: holderPhone.replace(/\D/g, '') || undefined,
                }
            } : undefined

            const result = await processCheckoutAction(courseIds, billingType, termsAccepted, cardData)

            if (!result.success) {
                setPaymentError(result.error || "Erro ao processar pagamento")
                setIsProcessing(false)
                return
            }

            setIsProcessing(false)
            clearCart()
            
            if (result.data) {
                const { setCheckoutResult } = useCartStore.getState()
                setCheckoutResult(result.data)
            }

            if (result.isFree) {
                router.push('/dashboard-student')
                return
            }

            if (result.data) {
                const { paymentId, billingType: respBillingType, invoiceUrl, status } = result.data

                if (respBillingType === 'CREDIT_CARD') {
                    router.push(`/pagamento/sucesso?id=${paymentId}&type=${respBillingType}`)
                    return
                }

                if (respBillingType === 'PIX' || respBillingType === 'BOLETO') {
                    router.push(`/pagamento/sucesso?id=${paymentId}&type=${respBillingType}`)
                    return
                }

                if (invoiceUrl) {
                    window.location.href = invoiceUrl
                    return
                }
            }

            router.push('/dashboard-student')
        } catch (error: any) {
            console.error(error)
            setPaymentError(error.message || "Erro fatal no pagamento. Tente novamente.")
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-montserrat mb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
                
                {/* Header Back Button */}
                <div className="mb-10">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-[#1D5F31] transition-colors group">
                        <div className="p-2 border border-slate-200 rounded-none group-hover:border-[#1D5F31] transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        Voltar ao Carrinho
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Coluna Esquerda (7/12): Formas de Pagamento */}
                    <div className="lg:col-span-7 space-y-10">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tighter text-[#1a1a1a] mb-2 max-w-xl">Escolha sua forma de pagamento</h1>
                            <p className="text-slate-500 font-medium">Selecione o método de sua preferência para concluir a inscrição.</p>
                        </div>

                        {mounted && !isLoadingProfile && (!userProfile?.cpf_cnpj && !userProfile?.cpf) && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex gap-4">
                                    <div className="bg-amber-100 p-2 rounded-lg h-fit text-amber-600">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold uppercase text-sm text-amber-900 tracking-tight">Ação Necessária: Cadastro de CPF</h3>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            Para sua segurança e conformidade com a emissão de notas fiscais, o Asaas exige um CPF ou CNPJ vinculado à sua conta.
                                        </p>
                                        <Link href="/dashboard-student/profile" className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 underline underline-offset-4 pt-2">
                                            Cadastrar agora no meu perfil →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mounted && !isLoadingProfile && (!userProfile?.cep || !userProfile?.numero) && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex gap-4">
                                    <div className="bg-amber-100 p-2 rounded-lg h-fit text-amber-600">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold uppercase text-sm text-amber-900 tracking-tight">Ação Necessária: Cadastro de Endereço</h3>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            Para pagamentos via PIX ou Boleto, é necessário cadastrar o CEP e o Número do endereço em seu perfil.
                                        </p>
                                        <Link href="/dashboard-student/profile" className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 underline underline-offset-4 pt-2">
                                            Cadastrar agora no meu perfil →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Cartão de Crédito */}
                            <div 
                                onClick={() => setSelectedMethod('credit_card')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'credit_card' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'credit_card' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">Cartão de Crédito</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Aprovação imediata • Parcelamento em até 12x</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <svg viewBox="0 0 48 32" className="h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                                        <path d="M19.5 21.5C20.375 20.625 18.75 20 18 19.5C16.5 18.75 15.5 18.125 14.25 17.5C13.125 16.937 12 16.625 10.875 16.625C9.6875 16.625 8.5625 17 7.5625 17.625C6.125 18.5 5.375 19.6875 5.375 21.125C5.375 22.3125 5.9375 23.3125 7.0625 24.0625C8.1875 24.8125 9.6875 25.25 11.5625 25.25C12.8125 25.25 14 25 15.0625 24.5625C16.1875 24.0625 17.1875 23.375 17.8125 22.5L19.5 21.5ZM13.375 19.5C14.1875 18.6875 13.875 18.0625 13.125 17.5625C12.3125 17 11.3125 16.75 10.125 16.75C8.6875 16.75 7.625 17.1875 6.875 18C6.1875 18.75 5.8125 19.8125 5.8125 21C5.8125 22.1875 6.1875 23.25 6.9375 24.0625C7.6875 24.875 8.75 25.3125 10 25.3125C11.5 25.3125 12.8125 24.875 13.9375 24C15.0625 23.125 15.5625 22 15.5625 20.75C15.5625 19.5625 15.125 18.5 14.3125 17.8125L13.375 19.5Z" fill="white"/>
                                        <path d="M28.6875 17.0625L27.8125 17.875C27.25 17.3125 26.5 17 25.6875 17C24.3125 17 23.3125 17.9375 22.875 19.0625L22.625 19.6875L22.5625 20C22.375 20.625 22.0625 21.125 21.625 21.5C21.125 21.9375 20.5 22.1875 19.75 22.1875C18.625 22.1875 17.75 21.6875 17.1875 20.8125C16.5625 19.875 16.3125 18.6875 16.3125 17.375C16.3125 15.9375 16.5625 14.625 17.1875 13.5625C17.8125 12.5 18.75 11.875 20 11.875C21.1875 11.875 22.1875 12.3125 23 13.0625L24.0625 12.3125C23.8125 11.875 23.375 11.5625 22.8125 11.375C22.1875 11.125 21.5 11 20.75 11C19.75 11 18.875 11.3125 18.125 11.9375C17.375 12.5625 17 13.5 17 14.75C17 15.6875 17.3125 16.5625 17.9375 17.3125C18.5625 18.0625 19.5625 18.4375 20.9375 18.4375C22.0625 18.4375 23.0625 18.0625 23.8125 17.4375C24.5625 16.8125 24.8125 15.9375 24.8125 14.875C24.8125 14 24.5625 13.1875 24.125 12.5L25.125 12C25.8125 12.8125 26.375 13.9375 26.375 15.3125C26.375 16.125 26.1875 16.875 25.8125 17.5625C25.5 18.25 24.8125 18.75 23.8125 18.75C23.0625 18.75 22.375 18.375 21.8125 17.75L22.8125 16.9375C24.0625 18.4375 25.625 19.1875 27.5 19.1875C28.5 19.1875 29.25 18.875 29.875 18.3125C30.5 17.6875 30.75 16.875 30.75 15.875C30.75 15 30.5 14.25 29.9375 13.625C29.375 13 28.5625 12.6875 27.5625 12.6875C26.625 12.6875 25.8125 13 25.1875 13.6875C24.5625 14.375 24.3125 15.25 24.3125 16.3125C24.3125 17.3125 24.625 18.1875 25.1875 18.9375L28.6875 17.0625Z" fill="white"/>
                                    </svg>
                                    <svg viewBox="0 0 48 32" className="h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="48" height="32" rx="4" fill="#EB001B"/>
                                        <circle cx="17" cy="16" r="10" fill="#EB001B"/>
                                        <circle cx="31" cy="16" r="10" fill="#F79E1B"/>
                                        <path d="M24 11.5C25.775 13.3 25.55 16 24 18.5C22.45 16 22.225 13.3 24 11.5Z" fill="#FF5F00"/>
                                        <path d="M24 20.5C22.225 18.7 22.45 16 24 13.5C25.55 16 25.775 18.7 24 20.5Z" fill="#EB001B"/>
                                    </svg>
                                </div>
                            </div>

                            {/* PIX */}
                            <div 
                                onClick={() => setSelectedMethod('pix')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'pix' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'pix' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">PIX</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Liberação instantânea • Desconto progressivo</p>
                                    </div>
                                </div>
                                <div className="bg-[#32BCAD]/10 text-[#32BCAD] px-2 py-1 text-[10px] font-bold uppercase tracking-tighter">Instantâneo</div>
                            </div>

                            {/* Boleto */}
                            <div 
                                onClick={() => setSelectedMethod('boleto')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'boleto' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'boleto' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <ReceiptText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">Boleto Bancário</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Compensação em até 48 horas úteis</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulário Cartão de Crédito */}
                        {selectedMethod === 'credit_card' && (
                            <div className="border border-gray-200 p-6 md:p-8 space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-[5px] text-[#1D5F31]">
                                    Dados do Cartão
                                </h3>

                                {/* Card Number */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                        Número do Cartão
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={e => setCardNumber(maskCardNumber(e.target.value))}
                                            maxLength={19}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                        {cardBrand && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-[#1D5F31]">
                                                {cardBrand}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Holder Name */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                        Nome do Titular (como está no cartão)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nome impresso no cartão"
                                        value={cardHolder}
                                        onChange={e => setCardHolder(e.target.value.toUpperCase())}
                                        className="w-full border border-gray-300 px-4 py-3.5 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none uppercase"
                                    />
                                </div>

                                {/* Expiry + CVC */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            Data de Expiração
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="MM/AA"
                                            value={cardExpiry}
                                            onChange={e => setCardExpiry(maskExpiry(e.target.value))}
                                            maxLength={5}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            CVC
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="123"
                                            value={cardCvc}
                                            onChange={e => setCardCvc(maskCvc(e.target.value))}
                                            maxLength={4}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-200" />

                                <h3 className="text-sm font-bold uppercase tracking-[5px] text-[#1D5F31]">
                                    Dados do Titular
                                </h3>
                                <p className="text-xs text-slate-500 font-medium -mt-4">
                                    Preencha os dados do dono do cartão. CPF/CNPJ, CEP e número são preenchidos automaticamente do seu perfil.
                                </p>

                                {/* CPF + Email */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            CPF / CNPJ
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="000.000.000-00"
                                            value={maskCpf(holderCpf)}
                                            onChange={e => setHolderCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            maxLength={14}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            E-mail
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={holderEmail}
                                            onChange={e => setHolderEmail(e.target.value)}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="(11) 99999-9999"
                                        value={maskPhone(holderPhone)}
                                        onChange={e => setHolderPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        maxLength={15}
                                        className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                    />
                                </div>

                                {/* CEP + Address Number */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            CEP
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="00000-000"
                                            value={maskCep(holderCep)}
                                            onChange={e => setHolderCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            maxLength={9}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                                            Número
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={holderAddressNumber}
                                            onChange={e => setHolderAddressNumber(e.target.value)}
                                            className="w-full border border-gray-300 px-4 py-3.5 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-none"
                                        />
                                    </div>
                                </div>

                                {/* Payment Error */}
                                {paymentError && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
                                        <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
                                                Erro no Pagamento
                                            </h4>
                                            <p className="text-xs text-red-700 mt-1 leading-relaxed">
                                                {paymentError}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Informação Asaas */}
                        <div className="pt-6 border-t border-slate-100 ">
                            <div className="flex items-center gap-3 text-slate-400">
                                <ShieldCheck size={20} />
                                <p className="text-sm font-medium">Pague com segurança através do Asaas. Seus dados estão protegidos.</p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita (5/12): Resumo do Pedido */}
                    <aside className="lg:col-span-5">
                        <div className="bg-white border border-gray-200 p-8 sticky top-32">
                            <h2 className="text-sm font-bold uppercase tracking-[5px] text-[#1D5F31] mb-8 ">Resumo Profissional</h2>

                            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-none overflow-hidden border border-slate-100 shrink-0">
                                            <img
                                                src={item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                                                className="w-full h-full object-cover"
                                                alt={item.title}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[12px] font-bold uppercase tracking-tight truncate text-[#1a1a1a]">{item.title}</h4>
                                            <span className="text-sm font-bold text-[#1D5F31]">
                                                {isLoadingPrices ? (
                                                    <span className="animate-pulse opacity-50">Carregando...</span>
                                                ) : (
                                                    item.price === 0 ? 'Gratuito' : `R$ ${item.price.toFixed(2)}`
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-slate-100 my-8" />

                            {/* Terms Acceptance Checkbox */}
                            <div className="mb-8">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border transition-all rounded-none flex items-center justify-center ${
                                            termsAccepted
                                                ? 'bg-[#1D5F31] border-[#1D5F31]'
                                                : 'bg-transparent border-slate-300 group-hover:border-slate-400'
                                        }`}>
                                            {termsAccepted && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-relaxed">
                                        Li e aceito os{' '}
                                        <a href="/termos" target="_blank" className="text-[#1D5F31] hover:underline">Termos de Uso</a>,{' '}
                                        <a href="/privacidade" target="_blank" className="text-[#1D5F31] hover:underline">Privacidade</a>{' '}
                                        e a{' '}
                                        <a href="/dashboard-student/refund-policy" target="_blank" className="text-[#1D5F31] hover:underline">Política de Reembolso</a>.
                                    </span>
                                </label>
                            </div>

                                <div className="space-y-4 mb-10">
                                <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                    <span>Subtotal</span>
                                    <span>R$ {(checkoutTotal > 0 ? checkoutTotal : getTotal()).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400">Total Final</span>
                                    <div className="text-4xl font-bold tracking-tighter text-[#1D5F31]">
                                        {checkoutTotal > 0
                                            ? `R$ ${checkoutTotal.toFixed(2)}`
                                            : isLoadingPrices
                                                ? <div className="h-10 w-32 bg-slate-100 animate-pulse" />
                                                : getTotal() === 0 ? 'Gratuito' : `R$ ${getTotal().toFixed(2)}`
                                        }
                                    </div>
                                </div>
                            </div>

                            {(!isLoadingProfile && !userProfile?.cpf_cnpj && !userProfile?.cpf) ? (
                                <button
                                    onClick={() => router.push('/dashboard-student/profile')}
                                    className="w-full py-6 bg-[#1D5F31] text-white hover:brightness-110 active:scale-[0.98] rounded-none font-bold uppercase  tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#1D5F31]/20"
                                >
                                    CADASTRAR CPF PARA PAGAR →
                                </button>
                            ) : (
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || isLoadingProfile || !termsAccepted}
                                    className={cn(
                                        "w-full py-6 rounded-none font-bold uppercase  tracking-[3px] transition-all flex items-center justify-center gap-3",
                                        (isProcessing || isLoadingProfile || !termsAccepted)
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-[#1D5F31] text-white hover:brightness-110 active:scale-[0.98]'
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            CONFIRMAR PAGAMENTO →
                                        </>
                                    )}
                                </button>
                            )}

                            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Lock size={16} className="text-slate-300" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Checkout<br/>Seguro</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-slate-300" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Proteção<br/>de Dados</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
