'use client'

import { useState, useMemo, Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { createProfile, getDataByCnpj, checkUsernameAvailability } from './actions'
import Logo from '@/components/Logo'
import { doc, updateDoc } from 'firebase/firestore'
import MFAChallenge from "@/components/MFAChallenge"
import { ArrowRight, AlertCircle, Eye, EyeOff, ChevronLeft, Building2, User } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { RegisterSchema, Step1Schema, Step2Schema, Step3Schema } from '@/lib/validations/register'
import { validateCPF, validateCNPJ, maskCPF, maskCNPJ, maskRG } from '@/lib/document-utils'
import { generateSlug } from '@/lib/utils'

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
}

const inputVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}



// ─── Máscaras ───────────────────────────────────────────────────────────────
function maskCpfCnpj(value: string, type: 'CPF' | 'CNPJ'): string {
    if (type === 'CPF') {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        return digits
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1-$2')
    } else {
        const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14)
        return v
            .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
            .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3')
            .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, '.$1/$2')
            .replace(/([A-Z0-9]{4})([A-Z0-9])/, '$1-$2')
    }
}

function maskDate(value: string): string {
    const digits = value.replace(/\D/g, '')
    return digits
        .replace(/^(\d{2})(\d)/, '$1/$2')
        .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
        .slice(0, 10)
}

function maskCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background-color)]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D5F31]"></div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    )
}

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const numberInputRef = useRef<HTMLInputElement>(null)
    const razaoSocialRef = useRef<HTMLInputElement>(null)
    const fullNameRef = useRef<HTMLInputElement>(null)

    // Captura o email da URL se existir
    const initialEmail = searchParams.get('email') || ''

    const [email, setEmail] = useState(initialEmail)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [personType, setPersonType] = useState<'CPF' | 'CNPJ'>('CPF')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [rg, setRg] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState<{ message: string; isEmailConflict: boolean } | null>(null)
    const [cpfCnpjTouched, setCpfCnpjTouched] = useState(false)
    const [teacherData, setTeacherData] = useState<any>(null)
    const [isTeacherFlow, setIsTeacherFlow] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [username, setUsername] = useState('')
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)
    const [usernameError, setUsernameError] = useState<string | null>(null)
    const [isMFAStep, setIsMFAStep] = useState(false)
    const [mfaEmail, setMfaEmail] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const clearFieldError = (field: string) => {
        setFieldErrors(prev => {
            if (prev[field]) {
                const next = { ...prev }
                delete next[field]
                return next
            }
            return prev
        })
    }

    const handleBlurValidation = (field: string) => {
        const valueMap: Record<string, string> = {
            fullName, email, phone, password, confirmPassword
        }
        const val = (valueMap[field] || '').trim()
        if (!val) {
            setFieldErrors(prev => {
                if (!prev[field]) return { ...prev, [field]: 'Este campo é obrigatório.' }
                return prev
            })
        } else {
            setFieldErrors(prev => {
                if (prev[field] === 'Este campo é obrigatório.') {
                    const next = { ...prev }
                    delete next[field]
                    return next
                }
                return prev
            })
        }
    }

    useEffect(() => {
        if (fullName && fullName.length > 2) {
            setUsername(generateSlug(fullName))
        } else {
            setUsername('')
        }
    }, [fullName])

    useEffect(() => {
        const stored = localStorage.getItem('powerplay_teacher_quiz')
        const isTeacherParam = searchParams.get('type') === 'teacher'

        if (stored && isTeacherParam) {
            try {
                const parsed = JSON.parse(stored)
                setTeacherData(parsed)
                setRole('teacher')
                setIsTeacherFlow(true)
            } catch (e) {
                console.error('Failed to parse teacher data', e)
                setIsTeacherFlow(false)
            }
        } else {
            setIsTeacherFlow(false)
            setRole('student')
        }
    }, [searchParams])

    const [step, setStep] = useState(1)
    const [razaoSocial, setRazaoSocial] = useState('')

    // Novos estados de endereço
    const [cep, setCep] = useState('')
    const [logradouro, setLogradouro] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [bairro, setBairro] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [isCepLoading, setIsCepLoading] = useState(false)
    const [isCnpjLoading, setIsCnpjLoading] = useState(false)
    const [cnpjError, setCnpjError] = useState<string | null>(null)
    const [cepError, setCepError] = useState('')

    const validateStep1 = (): Record<string, string> | null => {
        const result = Step1Schema.safeParse({
            fullName, email, phone, password, confirmPassword, username
        })
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            const fieldErrorMap: Record<string, string> = {}
            if (errors.fullName?.[0]) fieldErrorMap.fullName = errors.fullName[0]
            if (errors.email?.[0]) fieldErrorMap.email = errors.email[0]
            if (errors.phone?.[0]) fieldErrorMap.phone = errors.phone[0]
            if (errors.password?.[0]) fieldErrorMap.password = errors.password[0]
            if (errors.confirmPassword?.[0]) fieldErrorMap.confirmPassword = errors.confirmPassword[0]
            return Object.keys(fieldErrorMap).length > 0 ? fieldErrorMap : null
        }
        return null
    }

    const validateStep1WithUsername = async (): Promise<Record<string, string> | null> => {
        const fieldErrs = validateStep1()
        if (fieldErrs) return fieldErrs

        if (!username) return { fullName: 'O Nome Completo é obrigatório para gerar seu ID.' }

        setIsCheckingUsername(true)
        try {
            const result = await checkUsernameAvailability(username)
            if (!result.success) return { username: result.error || 'Erro ao validar ID' }
            if (!result.available) return { username: 'Este ID público já está em uso.' }
        } catch (e) {
            return { username: 'Erro ao validar disponibilidade do ID.' }
        } finally {
            setIsCheckingUsername(false)
        }

        return null
    }

    const validateStep2 = () => {
        const data: any = { personType }
        if (personType === 'CPF') {
            data.cpf = cpfCnpj
            data.birthDate = birthDate
            data.rg = rg
        } else {
            data.cnpj = cpfCnpj
            data.razaoSocial = razaoSocial
        }
        
        const result = Step2Schema.safeParse(data)
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            if (personType === 'CPF') {
                if (errors.cpf) return errors.cpf[0]
                if (errors.rg) return errors.rg[0]
                if (errors.birthDate) return errors.birthDate[0]
            } else {
                if (errors.cnpj) return errors.cnpj[0]
                if (errors.razaoSocial) return errors.razaoSocial[0]
            }
            return "Documento ou dados inválidos"
        }
        return null
    }

    const isFormValid = useMemo(() => {
        const data = {
            fullName, email, phone, password, confirmPassword,
            personType, 
            cpf: personType === 'CPF' ? cpfCnpj : undefined,
            rg: personType === 'CPF' ? rg : undefined,
            cnpj: personType === 'CNPJ' ? cpfCnpj : undefined,
            birthDate: personType === 'CPF' ? birthDate : undefined,
            razaoSocial: personType === 'CNPJ' ? razaoSocial : undefined,
            cep, logradouro, numero, complemento, bairro, cidade, estado, 
            termsAccepted, username
        }
        return RegisterSchema.safeParse(data).success
    }, [email, password, confirmPassword, fullName, phone, personType, cpfCnpj, rg, birthDate, razaoSocial, cep, logradouro, numero, complemento, bairro, cidade, estado, termsAccepted])

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpfCnpj(personType === 'CPF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
        if (cnpjError) setCnpjError(null)
    }

    const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRg(maskRG(e.target.value))
    }

    const handleTypeChange = (type: 'CPF' | 'CNPJ') => {
        if (type !== personType) {
            setPersonType(type)
            setCpfCnpj('')
            setRg('')
            setCpfCnpjTouched(false)
            setCnpjError(null)
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(maskPhone(e.target.value))
    }

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBirthDate(maskDate(e.target.value))
    }

    const handleCepSearch = async (cleanCep: string) => {
        setIsCepLoading(true)
        setCepError('')
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`)

            if (!response.ok) {
                setCepError('CEP não encontrado')
                return
            }

            const data = await response.json()

            setLogradouro(data.street || '')
            setBairro(data.neighborhood || '')
            setCidade(data.city || '')
            setEstado(data.state || '')

            setTimeout(() => {
                numberInputRef.current?.focus()
            }, 100)
        } catch (error) {
            setCepError('BrasilAPI indisponível. Preencha manualmente.')
        } finally {
            setIsCepLoading(false)
        }
    }

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const masked = maskCep(raw)
        setCep(masked)
        if (cepError) setCepError('')
        const cleanCep = masked.replace(/\D/g, '')
        if (cleanCep.length === 8 && !isCepLoading) {
            handleCepSearch(cleanCep)
        }
    }

    const handleCepBlur = () => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cleanCep.length === 8) {
            handleCepSearch(cleanCep)
        }
    }

    // Busca automática de CNPJ via API Route interna (evita CORS + fallback ReceitaWS)
    useEffect(() => {
        const triggerCnpjLookup = async () => {
            if (personType !== 'CNPJ') return

            // Limpar dados do CNPJ anterior antes de qualquer nova tentativa
            setRazaoSocial('')
            setCep('')
            setLogradouro('')
            setNumero('')
            setComplemento('')
            setBairro('')
            setCidade('')
            setEstado('')
            setCnpjError(null)

            const cnpjLimpo = cpfCnpj.toUpperCase().replace(/[^A-Z0-9]/g, '')

            if (cnpjLimpo.length === 14) {
                if (/[A-Z]/.test(cnpjLimpo)) {
                    setCnpjError('Formato de CNPJ novo detectado. Por favor, insira a Razão Social manualmente.')
                    razaoSocialRef.current?.focus()
                    return
                }

                setIsCnpjLoading(true)
                try {
                    const response = await fetch(`/api/cnpj?cnpj=${cnpjLimpo}`)

                    if (response.ok) {
                        const result = await response.json()

                        if (result.success) {
                            const d = result.data
                            setRazaoSocial(d.razao_social || '')

                            if (d.cep) setCep(maskCep(d.cep))
                            if (d.logradouro) setLogradouro(d.logradouro)
                            if (d.bairro) setBairro(d.bairro)
                            if (d.municipio) setCidade(d.municipio)
                            if (d.uf) setEstado(d.uf)
                            if (d.numero) setNumero(d.numero)
                            if (d.complemento) setComplemento(d.complemento)
                        } else {
                            setCnpjError(result.error || 'CNPJ não encontrado')
                        }
                    } else {
                        const result = await response.json()
                        setCnpjError(result.error || 'Erro ao consultar CNPJ')
                    }
                } catch (error) {
                    console.error('CNPJ lookup error:', error)
                    setCnpjError('Serviço indisponível. Preencha manualmente.')
                } finally {
                    setIsCnpjLoading(false)
                }
            } else {
                // CNPJ incompleto — limpar campos dependentes
                setRazaoSocial('')
                setCep('')
                setLogradouro('')
                setNumero('')
                setComplemento('')
                setBairro('')
                setCidade('')
                setEstado('')
            }
        }

        triggerCnpjLookup()
    }, [cpfCnpj, personType])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isFormValid) return

        setLoading(true)
        setFormError(null)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            await firebaseUpdateProfile(user, {
                displayName: fullName
            })

            // 1. Criar Perfil no Firestore (Essencial)
            // O ID Token prova ao servidor que quem cria o perfil é o dono do uid.
            const registrationIdToken = await user.getIdToken()
            const result = await createProfile({
                idToken: registrationIdToken,
                uid: user.uid,
                email,
                full_name: fullName,
                phone,
                cpf_cnpj: cpfCnpj,
                rg: rg,
                person_type: personType,
                razao_social: razaoSocial,
                username,
                birth_date: birthDate,
                role,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                terms_accepted: termsAccepted,
                ...(teacherData ? { teacher_application_data: teacherData } : {})
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            const idToken = await user.getIdToken(true)
            const sessionRes = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            })

            if (!sessionRes.ok) {
                throw new Error('session_creation_failed')
            }

            await updateDoc(doc(db, 'profiles', user.uid), { mfaCodeRequested: false })
            await new Promise(resolve => setTimeout(resolve, 300))
            await updateDoc(doc(db, 'profiles', user.uid), { mfaCodeRequested: true })

            setMfaEmail(user.email || '')
            setIsMFAStep(true)
        } catch (error: any) {
            console.error('Erro no cadastro:', error)
            const isEmailConflict = error?.code === 'auth/email-already-in-use'
            setFormError({
                isEmailConflict,
                message: isEmailConflict
                    ? 'Este e-mail já está cadastrado na PowerPlay.'
                    : (error.message || 'Verifique os dados e tente novamente.'),
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyMFA() {
        router.refresh()
        if (teacherData) {
            localStorage.removeItem('powerplay_teacher_quiz')
            router.push('/dashboard-teacher/courses')
        } else {
            router.push('/course')
        }
    }

    const errorInputStyle: React.CSSProperties = {
        border: '1.5px solid #e53e3e',
        backgroundColor: 'rgba(229, 62, 62, 0.06)',
        boxShadow: '0 0 0 3px rgba(229, 62, 62, 0.15)',
    }

    const inputClass = (hasError: boolean = false, isFieldLoading: boolean = false) =>
        `w-full p-4 bg-white/5 text-white border border-white/10 shadow-sm transition-all outline-none text-sm font-medium placeholder:text-white/30 focus:border-[#28b828] focus:bg-white/10 rounded-lg relative overflow-hidden ${hasError ? 'border-red-500/60' : ''} ${isFieldLoading ? 'opacity-50 animate-pulse' : ''}`

    const sectionTitleClass = 'text-white/40 text-[10px] uppercase tracking-widest font-bold mb-4 block border-b border-white/5 pb-2'
    const labelClass = 'text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1 block'

    return (
        <div className="min-h-screen w-full flex flex-row bg-[var(--background-color)] overflow-hidden font-montserrat">
            {/* Left Side - Visual (Full Column Image) */}
            <div className="hidden md:flex md:w-1/2 bg-[var(--background-color)] items-center justify-center p-0 overflow-hidden border-r border-white/5">
                <div className="w-full h-full relative">
                    <img
                        src="/register-illustration.png"
                        alt="PowerPlay"
                        className="w-full h-full object-cover object-center brightness-110 saturate-[0.9]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--background-color)]/80" />
                </div>
            </div>

            {/* Right Side - Form Area */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-start pt-8 md:pt-12 lg:pt-16 p-6 md:p-12 bg-[var(--background-color)] relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-[550px]">
                    {/* Header Section */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="text-center space-y-4 mb-10"
                    >
                        <div className="flex justify-center mb-4">
                            <Logo variant="vertical" className="scale-110" href="/" />
                        </div>
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase text-white">
                                {isTeacherFlow ? 'CADASTRO DE INSTRUTOR' : 'ALTA PERFORMANCE'}
                            </h2>
                            <p className="font-bold uppercase text-[9px] tracking-[4px] mt-2 text-white">
                                {isTeacherFlow ? 'FINALIZE SEU CADASTRO - POWERPLAY' : 'Crie sua conta'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                                <div className={`w-8 h-8 flex items-center justify-center font-bold text-xs transition-all rounded-md ${step >= s ? 'bg-[#28b828] text-white shadow-[0_0_15px_rgba(40,184,40,0.4)]' : 'bg-white/5 text-white/20 border border-white/10'}`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`h-[1px] flex-1 mx-2 transition-all ${step > s ? 'bg-[#28b828]' : 'bg-white/5'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {isMFAStep ? (
                        <MFAChallenge
                            email={mfaEmail}
                            onVerify={handleVerifyMFA}
                            onCancel={() => setIsMFAStep(false)}
                        />
                    ) : (
                        <div className="bg-transparent p-0">
                            <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Banner de Erro Inline */}
                            <AnimatePresence mode="wait">
                                {formError && (
                                    <motion.div
                                        key="form-error"
                                        initial={{ opacity: 0, y: -8, maxHeight: 0 }}
                                        animate={{ opacity: 1, y: 0, maxHeight: 300 }}
                                        exit={{ opacity: 0, y: -8, maxHeight: 0 }}
                                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                        className="overflow-hidden mb-6"
                                    >
                                        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                                            formError.isEmailConflict
                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                                        }`}>
                                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-widest">
                                                    {formError.message}
                                                </p>
                                                {formError.isEmailConflict && (
                                                    <p className="text-[10px] mt-1.5 text-white/50 uppercase tracking-wider">
                                                        Já tem uma conta?{' '}
                                                        <Link
                                                            href={`/login?email=${encodeURIComponent(email)}`}
                                                            className="text-[#28b828] font-bold hover:text-[#34d834] transition-colors underline underline-offset-2"
                                                        >
                                                            Entrar agora
                                                        </Link>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.section
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <span className={sectionTitleClass}>Passo 1: Dados de Acesso</span>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className={labelClass} htmlFor="fullName">Nome Completo</label>
                                                <input
                                                    ref={fullNameRef}
                                                    id="fullName"
                                                    type="text"
                                                    placeholder="NOME PARA CERTIFICADOS"
                                                    required
                                                    className={inputClass(!!fieldErrors.fullName || !!usernameError)}
                                                    style={fieldErrors.fullName || fieldErrors.username || usernameError ? errorInputStyle : undefined}
                                                    value={fullName}
                                                    onChange={(e) => {
                                                        setFullName(e.target.value)
                                                        clearFieldError('fullName')
                                                        clearFieldError('username')
                                                        if (usernameError) setUsernameError(null)
                                                    }}
                                                    onBlur={() => handleBlurValidation('fullName')}
                                                    aria-invalid={!!fieldErrors.fullName || !!fieldErrors.username}
                                                    aria-describedby={fieldErrors.fullName ? 'error-fullName' : fieldErrors.username ? 'error-username' : undefined}
                                                />
                                                {fieldErrors.fullName && (
                                                    <p id="error-fullName" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                        <span aria-hidden="true">✕</span> {fieldErrors.fullName}
                                                    </p>
                                                )}
                                                {!fieldErrors.fullName && !fieldErrors.username && !usernameError && username && (
                                                    <p className="text-[10px] font-bold text-[#28b828] uppercase tracking-wider mt-2 animate-pulse">
                                                        Seu ID público será: @{username}
                                                    </p>
                                                )}
                                                {(fieldErrors.username || usernameError) && (
                                                    <p id="error-username" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                        <span aria-hidden="true">✕</span> {usernameError || fieldErrors.username}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass} htmlFor="email">E-mail</label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        required
                                                        className={inputClass(!!fieldErrors.email)}
                                                        style={fieldErrors.email ? errorInputStyle : undefined}
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value)
                                                            clearFieldError('email')
                                                        }}
                                                        onBlur={() => handleBlurValidation('email')}
                                                        aria-invalid={!!fieldErrors.email}
                                                        aria-describedby={fieldErrors.email ? 'error-email' : undefined}
                                                    />
                                                    {fieldErrors.email && (
                                                        <p id="error-email" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                            <span aria-hidden="true">✕</span> {fieldErrors.email}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass} htmlFor="phone">WhatsApp / Telefone</label>
                                                    <input
                                                        id="phone"
                                                        type="text"
                                                        placeholder="(00) 00000-0000"
                                                        inputMode="numeric"
                                                        required
                                                        className={inputClass(!!fieldErrors.phone)}
                                                        style={fieldErrors.phone ? errorInputStyle : undefined}
                                                        value={phone}
                                                        onChange={(e) => {
                                                            handlePhoneChange(e)
                                                            clearFieldError('phone')
                                                        }}
                                                        onBlur={() => handleBlurValidation('phone')}
                                                        aria-invalid={!!fieldErrors.phone}
                                                        aria-describedby={fieldErrors.phone ? 'error-phone' : undefined}
                                                    />
                                                    {fieldErrors.phone && (
                                                        <p id="error-phone" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                            <span aria-hidden="true">✕</span> {fieldErrors.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass} htmlFor="password">Senha</label>
                                                    <div className="relative">
                                                        <input
                                                            id="password"
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            required
                                                            className={`${inputClass(!!fieldErrors.password)} pr-12`}
                                                            style={fieldErrors.password ? errorInputStyle : undefined}
                                                            value={password}
                                                            onChange={(e) => {
                                                                setPassword(e.target.value)
                                                                clearFieldError('password')
                                                            }}
                                                            onBlur={() => handleBlurValidation('password')}
                                                            aria-invalid={!!fieldErrors.password}
                                                            aria-describedby={fieldErrors.password ? 'error-password' : undefined}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-200 hover:text-white transition-colors p-1"
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {fieldErrors.password && (
                                                        <p id="error-password" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                            <span aria-hidden="true">✕</span> {fieldErrors.password}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass} htmlFor="confirmPassword">Confirmar Senha</label>
                                                    <div className="relative">
                                                        <input
                                                            id="confirmPassword"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            required
                                                            className={inputClass(!!fieldErrors.confirmPassword)}
                                                            style={fieldErrors.confirmPassword ? errorInputStyle : undefined}
                                                            value={confirmPassword}
                                                            onChange={(e) => {
                                                                setConfirmPassword(e.target.value)
                                                                clearFieldError('confirmPassword')
                                                            }}
                                                            onBlur={() => handleBlurValidation('confirmPassword')}
                                                            aria-invalid={!!fieldErrors.confirmPassword}
                                                            aria-describedby={fieldErrors.confirmPassword ? 'error-confirmPassword' : undefined}
                                                        />
                                                    </div>
                                                    {fieldErrors.confirmPassword && (
                                                        <p id="error-confirmPassword" className="text-[12px] text-[#e53e3e] mt-1 flex items-center gap-1">
                                                            <span aria-hidden="true">✕</span> {fieldErrors.confirmPassword}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isCheckingUsername}
                                            onClick={async () => {
                                                const fieldErrs = await validateStep1WithUsername()
                                                if (fieldErrs) {
                                                    setFieldErrors(fieldErrs)
                                                    setFormError({ message: Object.values(fieldErrs)[0], isEmailConflict: false })
                                                    if (fieldErrs.username) {
                                                        setUsernameError(fieldErrs.username)
                                                        setTimeout(() => fullNameRef.current?.focus(), 100)
                                                    }
                                                } else {
                                                    setFieldErrors({})
                                                    setFormError(null)
                                                    setStep(2)
                                                }
                                            }}
                                            className="w-full bg-[#28b828] text-white font-bold uppercase tracking-[3px] py-5 transition-all hover:bg-[#34d834] rounded-lg flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50"
                                        >
                                            {isCheckingUsername ? 'Validando ID...' : 'Próximo Passo'}
                                            {!isCheckingUsername && <ArrowRight size={18} />}
                                        </button>
                                    </motion.section>
                                )}

                                {step === 2 && (
                                    <motion.section
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-2">
                                            <button 
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className={sectionTitleClass + ' mb-0 border-0 pb-0'}>Passo 2: Identificação</span>
                                        </div>

                                        <div className="flex gap-1 bg-white/5 p-1 border border-white/10 mb-6 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleTypeChange('CPF')}
                                                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-all rounded-md ${personType === 'CPF' ? 'bg-[#28b828] text-white' : 'text-white/40 hover:text-white/60'}`}
                                            >
                                                <User size={14} />
                                                Pessoa Física
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleTypeChange('CNPJ')}
                                                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-all rounded-md ${personType === 'CNPJ' ? 'bg-[#28b828] text-white' : 'text-white/40 hover:text-white/60'}`}
                                            >
                                                <Building2 size={14} />
                                                Pessoa Jurídica
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className={labelClass}>{personType === 'CPF' ? 'CPF' : 'CNPJ'}</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder={personType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                                        inputMode="numeric"
                                                        required
                                                        className={inputClass()}
                                                        value={cpfCnpj}
                                                        onChange={handleCpfCnpjChange}
                                                    />
                                                    {isCnpjLoading && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <div className="animate-spin h-4 w-4 border-2 border-[#28b828] border-t-transparent rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                {cnpjError && (
                                                    <p className="text-[10px] text-red-400 font-medium mt-1">{cnpjError}</p>
                                                )}
                                            </div>

                                            {personType === 'CPF' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>RG</label>
                                                        <input
                                                            type="text"
                                                            placeholder="00.000.000-0"
                                                            inputMode="numeric"
                                                            className={inputClass()}
                                                            value={rg}
                                                            onChange={handleRgChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Data de Nascimento</label>
                                                        <input
                                                            type="text"
                                                            placeholder="DD/MM/AAAA"
                                                            inputMode="numeric"
                                                            required
                                                            maxLength={10}
                                                            className={inputClass()}
                                                            value={birthDate}
                                                            onChange={handleBirthDateChange}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Razão Social</label>
                                                    <input
                                                        ref={razaoSocialRef}
                                                        type="text"
                                                        placeholder="NOME DA EMPRESA"
                                                        required
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={razaoSocial}
                                                        onChange={(e) => setRazaoSocial(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const error = validateStep2()
                                                if (error) {
                                                    setFormError({ message: error, isEmailConflict: false })
                                                } else {
                                                    setFormError(null)
                                                    setStep(3)
                                                }
                                            }}
                                            className="w-full bg-[#28b828] text-white font-bold uppercase tracking-[3px] py-5 transition-all hover:bg-[#34d834] rounded-lg flex items-center justify-center gap-2 text-sm mt-4"
                                        >
                                            Próximo Passo
                                            <ArrowRight size={18} />
                                        </button>
                                    </motion.section>
                                )}

                                {step === 3 && (
                                    <motion.section
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-2">
                                            <button 
                                                type="button"
                                                onClick={() => setStep(2)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className={sectionTitleClass + ' mb-0 border-0 pb-0'}>Passo 3: Endereço</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-5 space-y-1">
                                                    <label className={labelClass}>CEP</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="00000-000"
                                                            inputMode="numeric"
                                                            required
                                                            className={inputClass(!!cepError)}
                                                            value={cep}
                                                            onChange={handleCepChange}
                                                            onBlur={handleCepBlur}
                                                        />
                                                        {isCepLoading && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <div className="animate-spin h-3 w-3 border-2 border-[#28b828] border-t-transparent rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-7 space-y-1">
                                                    <label className={labelClass}>Rua/Logradouro</label>
                                                    <input
                                                        type="text"
                                                        placeholder="AV. INDUSTRIAL"
                                                        required
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={logradouro}
                                                        onChange={(e) => setLogradouro(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-4 space-y-1">
                                                    <label className={labelClass}>Número</label>
                                                    <input
                                                        ref={numberInputRef}
                                                        type="text"
                                                        placeholder="000"
                                                        required
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={numero}
                                                        onChange={(e) => setNumero(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-8 space-y-1">
                                                    <label className={labelClass}>Complemento</label>
                                                    <input
                                                        type="text"
                                                        placeholder="APTO/SALA"
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={complemento}
                                                        onChange={(e) => setComplemento(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-12 space-y-1">
                                                    <label className={labelClass}>Bairro</label>
                                                    <input
                                                        type="text"
                                                        placeholder="BAIRRO"
                                                        required
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={bairro}
                                                        onChange={(e) => setBairro(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-8 space-y-1">
                                                    <label className={labelClass}>Cidade</label>
                                                    <input
                                                        type="text"
                                                        placeholder="CIDADE"
                                                        required
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={cidade}
                                                        onChange={(e) => setCidade(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-4 space-y-1">
                                                    <label className={labelClass}>Estado/UF</label>
                                                    <input
                                                        type="text"
                                                        placeholder="UF"
                                                        required
                                                        maxLength={2}
                                                        className={inputClass(false, isCnpjLoading)}
                                                        value={estado}
                                                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className="relative mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={termsAccepted}
                                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 border transition-all rounded flex items-center justify-center ${
                                                        termsAccepted
                                                            ? 'bg-[#28b828] border-[#28b828]'
                                                            : 'bg-white/5 border-white/20 group-hover:border-white/40'
                                                    }`}>
                                                        {termsAccepted && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-white/40 uppercase tracking-wider leading-relaxed">
                                                    Concordo com os <Link href="/termos" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#28b828] transition-colors underline underline-offset-2">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#28b828] transition-colors underline underline-offset-2">Política de Privacidade</Link>.
                                                </p>
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !isFormValid}
                                            className="w-full bg-gradient-to-r from-[#1D5F31] via-[#28b828] to-[#1D5F31] hover:from-[#28b828] hover:via-[#34d834] hover:to-[#28b828] text-white font-bold uppercase tracking-[3px] py-5 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-3 text-sm shadow-[0_0_20px_rgba(40,184,40,0.3)]"
                                        >
                                            {loading ? 'SINCRONIZANDO...' : 'CONCLUIR CADASTRO'}
                                            {!loading && <ArrowRight size={18} />}
                                        </button>
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            {step === 1 && !isTeacherFlow && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/register/be-a-teacher?email=${encodeURIComponent(email)}` as any)}
                                    className="w-full py-5 text-white bg-transparent border border-[#28b828] font-bold uppercase tracking-[3px] text-xs rounded-lg transition-all hover:bg-white/5"
                                >
                                    Seja um Professor PowerPlay
                                </button>
                            )}

                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
