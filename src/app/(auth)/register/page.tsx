'use client'

import { useState, useMemo, Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile, sendEmailVerification } from 'firebase/auth'
import { createProfile, getAddressByCep, getDataByCnpj, checkUsernameAvailability } from './actions'
import Logo from '@/components/Logo'
import { ArrowRight, AlertCircle, Eye, EyeOff, ChevronLeft, Building2, User } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { RegisterSchema, Step1Schema, Step2Schema, Step3Schema } from '@/lib/validations/register'
import { validateCPF, validateCNPJ, maskCPF, maskCNPJ } from '@/lib/document-utils'
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
    const digits = value.replace(/\D/g, '')
    if (type === 'CPF') {
        const limited = digits.slice(0, 11)
        return limited
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1-$2')
    } else {
        const limited = digits.slice(0, 14)
        return limited
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
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
    const [rua, setRua] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [bairro, setBairro] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [isCepLoading, setIsCepLoading] = useState(false)
    const [isCnpjLoading, setIsCnpjLoading] = useState(false)
    const [cepError, setCepError] = useState('')

    const validateStep1 = () => {
        const result = Step1Schema.safeParse({
            fullName, email, phone, password, confirmPassword, username
        })
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            if (errors.fullName) return errors.fullName[0]
            if (errors.email) return errors.email[0]
            if (errors.phone) return errors.phone[0]
            if (errors.password) return errors.password[0]
            if (errors.confirmPassword) return errors.confirmPassword[0]
            return "Verifique os dados informados"
        }
        return null
    }

    const validateStep1WithUsername = async () => {
        const error = validateStep1()
        if (error) return error

        if (!username) return 'O Nome Completo é obrigatório para gerar seu ID.'

        setIsCheckingUsername(true)
        try {
            const result = await checkUsernameAvailability(username)
            if (!result.success) return result.error
            if (!result.available) return 'Este ID (@' + username + ') já está em uso por outro usuário. Tente adicionar um sobrenome ou número ao seu nome.'
        } catch (e) {
            return 'Erro ao validar disponibilidade do ID.'
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
        } else {
            data.cnpj = cpfCnpj
            data.razaoSocial = razaoSocial
        }
        
        const result = Step2Schema.safeParse(data)
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            if (personType === 'CPF') {
                if (errors.cpf) return errors.cpf[0]
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
            cnpj: personType === 'CNPJ' ? cpfCnpj : undefined,
            birthDate: personType === 'CPF' ? birthDate : undefined,
            razaoSocial: personType === 'CNPJ' ? razaoSocial : undefined,
            cep, rua, numero, complemento, bairro, cidade, estado, 
            termsAccepted, username
        }
        return RegisterSchema.safeParse(data).success
    }, [email, password, confirmPassword, fullName, phone, personType, cpfCnpj, birthDate, razaoSocial, cep, rua, numero, complemento, bairro, cidade, estado, termsAccepted])

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpfCnpj(personType === 'CPF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
    }

    const handleTypeChange = (type: 'CPF' | 'CNPJ') => {
        if (type !== personType) {
            setPersonType(type)
            setCpfCnpj('')
            setCpfCnpjTouched(false)
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(maskPhone(e.target.value))
    }

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBirthDate(maskDate(e.target.value))
    }

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCep(maskCep(e.target.value))
        if (cepError) setCepError('')
    }

    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cleanCep.length === 8) {
            setIsCepLoading(true)
            setCepError('')
            try {
                const result = await getAddressByCep(cleanCep)
                if (result.success && result.data) {
                    setRua(result.data.rua || '')
                    setBairro(result.data.bairro || '')
                    setCidade(result.data.cidade || '')
                    setEstado(result.data.estado || '')

                    // Focar no campo Número automaticamente
                    setTimeout(() => {
                        numberInputRef.current?.focus()
                    }, 100)
                } else {
                    setCepError(result.error || 'Erro ao buscar CEP')
                }
            } catch (error) {
                setCepError('ViaCEP indisponível. Preencha manualmente.')
            } finally {
                setIsCepLoading(false)
            }
        }
    }

    // Busca automática de CNPJ - Refatorado para fetch direto (Instrução do Usuário)
    useEffect(() => {
        const triggerCnpjLookup = async () => {
            if (personType !== 'CNPJ') return
            
            // Limpeza Obrigatória: extrair apenas os números
            const cnpjLimpo = cpfCnpj.replace(/\D/g, '') 
            
            // Condição de Disparo: exatamente 14 dígitos numéricos
            if (cnpjLimpo.length === 14) {
                setIsCnpjLoading(true)
                try {
                    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
                    
                    if (response.ok) {
                        const data = await response.json()
                        
                        // Ajuste de Valor: preencher campos de Razão Social e Endereço
                        setRazaoSocial(data.razao_social || data.nome_fantasia || '')
                        
                        if (data.cep) setCep(maskCep(data.cep))
                        if (data.logradouro) setRua(data.logradouro)
                        if (data.bairro) setBairro(data.logradouro) // Fallback para bairro se necessário
                        if (data.bairro) setBairro(data.bairro)
                        if (data.municipio) setCidade(data.municipio)
                        if (data.uf) setEstado(data.uf)
                        if (data.numero) setNumero(data.numero)
                        if (data.complemento) setComplemento(data.complemento)
                    }
                } catch (error) {
                    console.error('Brasil API Client Error:', error)
                } finally {
                    setIsCnpjLoading(false)
                }
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
            const result = await createProfile({
                uid: user.uid,
                email,
                full_name: fullName,
                phone,
                cpf_cnpj: cpfCnpj,
                person_type: personType,
                razao_social: razaoSocial,
                username,
                birth_date: birthDate,
                role,
                cep,
                rua,
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

            // 2. Tentar enviar e-mail de verificação (Não bloqueante)
            try {
                await sendEmailVerification(user)
            } catch (verifyError: any) {
                console.warn('Falha ao enviar e-mail de verificação (provável limite de cota):', verifyError)
                // Não lançamos erro aqui para não interromper o fluxo do usuário
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

            router.refresh()

            if (teacherData) {
                localStorage.removeItem('powerplay_teacher_quiz')
            }

            router.push('/verify-email')
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
                            <Logo variant="vertical" className="scale-110" />
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

                    {/* Form Container */}
                    <div className="bg-transparent p-0">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Banner de Erro Inline */}
                            <AnimatePresence mode="wait">
                                {formError && (
                                    <motion.div
                                        key="form-error"
                                        initial={{ opacity: 0, y: -8, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -8, height: 0 }}
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
                                                <label className={labelClass}>Nome Completo</label>
                                                <input
                                                    type="text"
                                                    placeholder="NOME PARA CERTIFICADOS"
                                                    required
                                                    className={inputClass()}
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                />
                                                {username && (
                                                    <p className="text-[10px] font-bold text-[#28b828] uppercase tracking-wider mt-2 animate-pulse">
                                                        Seu ID público será: @{username}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>E-mail</label>
                                                    <input
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        required
                                                        className={inputClass()}
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>WhatsApp / Telefone</label>
                                                    <input
                                                        type="text"
                                                        placeholder="(00) 00000-0000"
                                                        inputMode="numeric"
                                                        required
                                                        className={inputClass()}
                                                        value={phone}
                                                        onChange={handlePhoneChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Senha</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            required
                                                            className={`${inputClass()} pr-12`}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-200 hover:text-white transition-colors p-1"
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Confirmar Senha</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            required
                                                            className={inputClass(confirmPassword !== "" && password !== confirmPassword)}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isCheckingUsername}
                                            onClick={async () => {
                                                const error = await validateStep1WithUsername()
                                                if (error) {
                                                    setFormError({ message: error, isEmailConflict: false })
                                                } else {
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
                                            </div>

                                            {personType === 'CPF' ? (
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
                                            ) : (
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Razão Social</label>
                                                    <input
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
                                                        value={rua}
                                                        onChange={(e) => setRua(e.target.value)}
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

                            {step === 1 && (
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
                </div>
            </div>
        </div>
    )
}
