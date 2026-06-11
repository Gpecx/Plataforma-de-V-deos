'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ChevronLeft, User, Building2, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Step2Schema, Step3Schema } from '@/lib/validations/register'
import { maskCPF, maskCNPJ, maskRG, validateCPF, validateCNPJ } from '@/lib/document-utils'
import { generateSlug } from '@/lib/utils'
import { createProfile, checkUsernameAvailability } from '@/app/(auth)/register/actions'

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
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

interface GoogleProfileModalProps {
    isOpen: boolean
    user: {
        uid: string
        email: string
        displayName: string
        idToken: string
    }
    onSuccess: () => void
    onClose: () => void
}

export function GoogleCompleteProfileModal({ isOpen, user, onSuccess, onClose }: GoogleProfileModalProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState<{ message: string } | null>(null)
    const numberInputRef = useRef<HTMLInputElement>(null)

    const [personType, setPersonType] = useState<'CPF' | 'CNPJ'>('CPF')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [rg, setRg] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [phone, setPhone] = useState('')
    const [razaoSocial, setRazaoSocial] = useState('')
    const [isCnpjLoading, setIsCnpjLoading] = useState(false)
    const [cnpjError, setCnpjError] = useState<string | null>(null)
    const razaoSocialRef = useRef<HTMLInputElement>(null)

    const [cep, setCep] = useState('')
    const [logradouro, setLogradouro] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [bairro, setBairro] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [isCepLoading, setIsCepLoading] = useState(false)
    const [cepError, setCepError] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [username, setUsername] = useState(() => generateSlug(user.displayName || ''))
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setLoading(false)
            setFormError(null)
            setPersonType('CPF')
            setCpfCnpj('')
            setRg('')
            setBirthDate('')
            setPhone('')
            setRazaoSocial('')
            setIsCnpjLoading(false)
            setCnpjError(null)
            setCep('')
            setLogradouro('')
            setNumero('')
            setComplemento('')
            setBairro('')
            setCidade('')
            setEstado('')
            setIsCepLoading(false)
            setCepError('')
            setTermsAccepted(false)
            setUsername(generateSlug(user.displayName || ''))
            setUsernameAvailable(null)
            setIsCheckingUsername(false)
        }
    }, [isOpen])

    const handleUsernameBlur = async () => {
        if (!username || username.length < 3) return
        setIsCheckingUsername(true)
        setUsernameAvailable(null)
        try {
            const result = await checkUsernameAvailability(username)
            setUsernameAvailable(result.available ?? false)
        } catch {
            setUsernameAvailable(null)
        } finally {
            setIsCheckingUsername(false)
        }
    }

    const validateStep1 = () => {
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
            return 'Documento ou dados inválidos'
        }
        return null
    }

    const isStep2Complete = useMemo(() => {
        if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) return false
        if (!termsAccepted) return false
        const result = Step3Schema.safeParse({
            cep, logradouro, numero, complemento, bairro, cidade, estado, termsAccepted
        })
        return result.success
    }, [cep, logradouro, numero, complemento, bairro, cidade, estado, termsAccepted])

    const handleTypeChange = (type: 'CPF' | 'CNPJ') => {
        if (type !== personType) {
            setPersonType(type)
            setCpfCnpj('')
            setRg('')
            setCnpjError(null)
        }
    }

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpfCnpj(personType === 'CPF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
        if (cnpjError) setCnpjError(null)
    }

    const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRg(maskRG(e.target.value))
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
        } catch {
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

    useEffect(() => {
        const triggerCnpjLookup = async () => {
            if (personType !== 'CNPJ') return
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
                    setCnpjError('Formato de CNPJ novo detectado. Preencha a Razão Social manualmente.')
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
                } catch {
                    setCnpjError('Serviço indisponível. Preencha manualmente.')
                } finally {
                    setIsCnpjLoading(false)
                }
            }
        }
        triggerCnpjLookup()
    }, [cpfCnpj, personType])

    async function handleSubmit() {
        if (!isStep2Complete) return
        setLoading(true)
        setFormError(null)

        try {
            const token = user.idToken
            const result = await createProfile({
                idToken: token,
                uid: user.uid,
                email: user.email,
                full_name: user.displayName,
                phone,
                cpf_cnpj: cpfCnpj,
                rg: personType === 'CPF' ? rg : undefined,
                person_type: personType,
                razao_social: personType === 'CNPJ' ? razaoSocial : undefined,
                username: username || undefined,
                birth_date: birthDate,
                role: 'student',
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                terms_accepted: termsAccepted,
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            onSuccess()
        } catch (error: any) {
            setFormError({ message: error.message || 'Erro ao criar perfil. Tente novamente.' })
        } finally {
            setLoading(false)
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
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loading) onClose()
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-[var(--background-color)] border border-white/10 rounded-2xl p-6 md:p-10 font-montserrat"
                    >
                        {/* Header */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="text-center space-y-3 mb-8"
                        >
                            <h2 className="text-2xl font-bold tracking-tighter uppercase text-white">
                                FINALIZE SEU CADASTRO
                            </h2>
                            <p className="font-bold uppercase text-[9px] tracking-[4px] text-white">
                                POWERPLAY — complete seus dados
                            </p>
                            <p className="text-[11px] text-white/40">
                                Olá, <span className="text-[#28b828] font-bold">{user.displayName}</span> — faltam só alguns dados.
                            </p>
                        </motion.div>

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-between mb-8 px-2">
                            {[1, 2].map((s) => (
                                <div key={s} className="flex items-center flex-1 last:flex-none">
                                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-xs transition-all rounded-md ${step >= s ? 'bg-[#28b828] text-white shadow-[0_0_15px_rgba(40,184,40,0.4)]' : 'bg-white/5 text-white/20 border border-white/10'}`}>
                                        {s}
                                    </div>
                                    {s < 2 && (
                                        <div className={`h-[1px] flex-1 mx-2 transition-all ${step > s ? 'bg-[#28b828]' : 'bg-white/5'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Form Error */}
                        <AnimatePresence mode="wait">
                            {formError && (
                                <motion.div
                                    key="form-error"
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    className="overflow-hidden mb-6"
                                >
                                    <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-300">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest">
                                            {formError.message}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Step 1: Identification */}
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.section
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <span className={sectionTitleClass}>Passo 1: Identificação</span>

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

                                    <div className="space-y-1">
                                        <label className={labelClass}>Seu ID Público (@username)</label>
                                        <input
                                            type="text"
                                            placeholder="seu-id-publico"
                                            className={inputClass(usernameAvailable === false)}
                                            style={usernameAvailable === false ? errorInputStyle : undefined}
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(generateSlug(e.target.value))
                                                setUsernameAvailable(null)
                                            }}
                                            onBlur={handleUsernameBlur}
                                            aria-invalid={usernameAvailable === false}
                                            aria-describedby={usernameAvailable === false ? 'error-username-google' : undefined}
                                        />
                                        {isCheckingUsername && (
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">
                                                Verificando disponibilidade...
                                            </p>
                                        )}
                                        {!isCheckingUsername && usernameAvailable === true && (
                                            <p className="text-[10px] text-[#28b828] font-bold uppercase tracking-wider mt-1">
                                                ✓ @{username} disponível
                                            </p>
                                        )}
                                        {!isCheckingUsername && usernameAvailable === false && (
                                            <p id="error-username-google" className="text-[12px] text-[#e53e3e] font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                                <span aria-hidden="true">✕</span> Este ID já está em uso. Tente outro.
                                            </p>
                                        )}
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
                                        disabled={usernameAvailable === false || isCheckingUsername}
                                        onClick={() => {
                                            const error = validateStep1()
                                            if (error) {
                                                setFormError({ message: error })
                                            } else {
                                                setFormError(null)
                                                setStep(2)
                                            }
                                        }}
                                        className="w-full bg-[#28b828] text-white font-bold uppercase tracking-[3px] py-5 transition-all hover:bg-[#34d834] rounded-lg flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50"
                                    >
                                        {isCheckingUsername ? 'Verificando...' : 'Próximo Passo'}
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
                                        <span className={sectionTitleClass + ' mb-0 border-0 pb-0'}>Passo 2: Endereço</span>
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
                                        type="button"
                                        disabled={loading || !isStep2Complete}
                                        onClick={handleSubmit}
                                        className="w-full bg-gradient-to-r from-[#1D5F31] via-[#28b828] to-[#1D5F31] hover:from-[#28b828] hover:via-[#34d834] hover:to-[#28b828] text-white font-bold uppercase tracking-[3px] py-5 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-3 text-sm shadow-[0_0_20px_rgba(40,184,40,0.3)]"
                                    >
                                        {loading ? 'SINCRONIZANDO...' : 'CONCLUIR CADASTRO'}
                                        {!loading && <ArrowRight size={18} />}
                                    </button>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
