'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { createProfile } from './actions'
import Logo from '@/components/Logo'
import { UserPlus, User, GraduationCap, ArrowRight } from 'lucide-react'

// ─── Validação CPF ──────────────────────────────────────────────────────────
function validateCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) return false
    if (/^(\d)\1{10}$/.test(digits)) return false // Rejeita sequências iguais

    let sum = 0
    let rest
    for (let i = 1; i <= 9; i++) sum += parseInt(digits.substring(i - 1, i)) * (11 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(digits.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) sum += parseInt(digits.substring(i - 1, i)) * (12 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(digits.substring(10, 11))) return false

    return true
}

// ─── Validação CNPJ ─────────────────────────────────────────────────────────
function validateCnpj(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return false
    if (/^(\d)\1{13}$/.test(digits)) return false

    let length = digits.length - 2
    let numbers = digits.substring(0, length)
    let checkDigits = digits.substring(length)
    let sum = 0
    let pos = length - 7
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--
        if (pos < 2) pos = 9
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(checkDigits.charAt(0))) return false

    length = length + 1
    numbers = digits.substring(0, length)
    sum = 0
    pos = length - 7
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--
        if (pos < 2) pos = 9
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(checkDigits.charAt(1))) return false

    return true
}

// ─── Máscara CPF/CNPJ Adaptativa ─────────────────────────────────────────────
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

// ─── Máscara Data DD/MM/AAAA ──────────────────────────────────────────────────
function maskDate(value: string): string {
    const digits = value.replace(/\D/g, '')
    return digits
        .replace(/^(\d{2})(\d)/, '$1/$2')
        .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
        .slice(0, 10)
}

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [personType, setPersonType] = useState<'CPF' | 'CNPJ'>('CPF')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [loading, setLoading] = useState(false)
    const [cpfCnpjTouched, setCpfCnpjTouched] = useState(false)
    const router = useRouter()

    // Validação em tempo real
    const isCpfCnpjValid = useMemo(() => {
        if (!cpfCnpj) return false
        return personType === 'CPF' ? validateCpf(cpfCnpj) : validateCnpj(cpfCnpj)
    }, [cpfCnpj, personType])

    // Validação da data básica (apenas tamanho para este passo)
    const isBirthDateValid = birthDate.length === 10

    const isFormValid = useMemo(() => {
        return email.includes('@') &&
            password.length >= 6 &&
            fullName.length > 3 &&
            isCpfCnpjValid &&
            isBirthDateValid
    }, [email, password, fullName, isCpfCnpjValid, isBirthDateValid])

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpfCnpj(maskCpfCnpj(e.target.value, personType))
    }

    const handleTypeChange = (type: 'CPF' | 'CNPJ') => {
        if (type !== personType) {
            setPersonType(type)
            setCpfCnpj('')
            setCpfCnpjTouched(false)
        }
    }

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBirthDate(maskDate(e.target.value))
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isFormValid) return

        setLoading(true)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            await firebaseUpdateProfile(user, {
                displayName: fullName
            })

            const result = await createProfile({
                uid: user.uid,
                email,
                full_name: fullName,
                cpf_cnpj: cpfCnpj,
                person_type: personType,
                birth_date: birthDate,
                role
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            const idToken = await user.getIdToken()
            const { setSessionCookie } = await import('@/app/actions/auth')
            await setSessionCookie(idToken)

            if (role === 'teacher') {
                router.push('/dashboard-teacher')
            } else {
                router.push('/dashboard-student')
            }
            router.refresh()
        } catch (error: any) {
            console.error('Erro no cadastro:', error)
            alert('Erro no cadastro: ' + (error.message || 'Verifique os dados e tente novamente.'))
        } finally {
            setLoading(false)
        }
    }

    const inputClass = (hasError: boolean = false) =>
        `w-full p-4 bg-black/40 text-white border transition-all outline-none text-sm font-medium placeholder:text-gray-600 hover:bg-black/60 ${hasError
            ? 'border-red-500 focus:border-red-600'
            : 'border-[#1e4d2b] focus:border-[#00C402] focus:ring-1 focus:ring-[#00C402]'
        }`

    const labelClass = 'text-[10px] font-black uppercase tracking-widest text-[#00C402]/80'

    return (
        <div className="min-h-screen w-full flex flex-row bg-[#08150c] overflow-hidden font-exo">
            {/* Left Side - Visual (Full Column Image) */}
            <div className="hidden md:flex md:w-1/2 bg-[#08150c] items-center justify-center p-0 overflow-hidden border-r border-[#1e4d2b]">
                <div className="w-full h-full relative">
                    <img
                        src="/register-illustration.png"
                        alt="PowerPlay"
                        className="w-full h-full object-cover object-center brightness-90 saturate-[0.8]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#08150c]/80" />
                </div>
            </div>

            {/* Right Side - Form Area */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-start pt-8 md:pt-12 lg:pt-16 p-6 md:p-12 bg-[#08150c] relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-[450px]">
                    {/* Header Section */}
                    <div className="text-center space-y-4 mb-8">
                        <div className="flex justify-center mb-4">
                            <Logo variant="vertical" className="scale-110" />
                        </div>
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">Criar Conta Grátis</h2>
                            <p className="text-[#32cd32] font-bold uppercase text-[9px] tracking-[4px] mt-2 opacity-80">Evolução e Conquistas</p>
                        </div>
                    </div>

                    {/* Form Container (Square Card) */}
                    <div className="bg-black/20 p-8 border border-[#1e4d2b] shadow-2xl">
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-5">

                                {/* Tipo de Conta */}
                                <div className="space-y-2 mb-2">
                                    <label className={labelClass}>Tipo de Perfil</label>
                                    <div className="flex gap-2 p-1 bg-black/40 border border-[#1e4d2b]">
                                        <button
                                            type="button"
                                            onClick={() => setRole('student')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase transition-all ${role === 'student' ? 'bg-[#00C402]/20 text-[#00C402] border border-[#00C402]/30' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            <User className="w-4 h-4" />
                                            Aluno
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('teacher')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase transition-all ${role === 'teacher' ? 'bg-[#00C402]/20 text-[#00C402] border border-[#00C402]/30' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            <GraduationCap className="w-4 h-4" />
                                            Professor
                                        </button>
                                    </div>
                                </div>

                                {/* Nome Completo */}
                                <div className="space-y-2">
                                    <label className={labelClass}>Nome Completo</label>
                                    <input
                                        type="text"
                                        placeholder="DIGITE SEU NOME PARA CERTIFICADOS"
                                        required
                                        className={`${inputClass()} rounded-none`}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                {/* E-mail e Senha */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className={labelClass}>E-mail de Acesso</label>
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            required
                                            className={`${inputClass()} rounded-none`}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Defina sua Senha</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            className={`${inputClass()} rounded-none`}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* CPF/CNPJ e Data de Nascimento */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <label className={labelClass}>Documento</label>
                                            <div className="flex gap-1 bg-black/40 p-0.5 border border-[#1e4d2b]">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTypeChange('CPF')}
                                                    className={`px-2 py-0.5 text-[8px] font-black uppercase transition-all ${personType === 'CPF'
                                                        ? 'bg-[#00C402] text-black'
                                                        : 'text-gray-500 hover:text-gray-300'
                                                        }`}
                                                >
                                                    CPF
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTypeChange('CNPJ')}
                                                    className={`px-2 py-0.5 text-[8px] font-black uppercase transition-all ${personType === 'CNPJ'
                                                        ? 'bg-[#00C402] text-black'
                                                        : 'text-gray-500 hover:text-gray-300'
                                                        }`}
                                                >
                                                    CNPJ
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={personType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                            inputMode="numeric"
                                            required
                                            className={`${inputClass(cpfCnpjTouched && !isCpfCnpjValid)} rounded-none`}
                                            value={cpfCnpj}
                                            onChange={handleCpfCnpjChange}
                                            onBlur={() => setCpfCnpjTouched(true)}
                                        />
                                        {cpfCnpjTouched && !isCpfCnpjValid && (
                                            <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider pt-1">
                                                {personType} INVÁLIDO
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Nascimento</label>
                                        <input
                                            type="text"
                                            placeholder="DD/MM/AAAA"
                                            inputMode="numeric"
                                            required
                                            maxLength={10}
                                            className={`${inputClass()} rounded-none`}
                                            value={birthDate}
                                            onChange={handleBirthDateChange}
                                        />
                                    </div>
                                </div>

                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="group relative w-full overflow-hidden bg-[#32cd32] hover:bg-[#28b828] text-white font-black uppercase tracking-[2px] py-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-4 active:scale-[0.99]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            PROCESSANDO...
                                        </span>
                                    ) : (
                                        <>
                                            CONCLUIR CADASTRO
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>

                            {!isFormValid && !loading && (
                                <p className="text-[8px] text-gray-400 text-center font-bold uppercase tracking-[2px] mt-2 opacity-50">
                                    Aguardando preenchimento correto...
                                </p>
                            )}

                            <div className="mt-10 pt-6 border-t border-white/10 text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    Já possui acesso?{' '}
                                    <Link href="/login" className="text-[#32cd32] font-black hover:text-[#28b828] transition-colors underline underline-offset-4">
                                        ENTRAR AGORA
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}