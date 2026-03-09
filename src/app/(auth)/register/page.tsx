'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { createProfile } from './actions'
import Logo from '@/components/Logo'

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
        `w-full p-4 rounded-xl bg-slate-50 text-black border transition-all outline-none text-sm font-medium placeholder:text-gray-700 ${hasError
            ? 'border-red-500 focus:border-red-600'
            : 'border-slate-300 focus:border-[#00C402] focus:ring-1 focus:ring-[#00C402]'
        }`

    const labelClass = 'text-[10px] font-black uppercase tracking-widest text-slate-900'

    return (
        <div className="w-full">
            <div className="text-center space-y-4 pt-4 pb-10">
                <div className="flex justify-center mb-2">
                    <Logo variant="text-only" className="scale-110" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-700">Criar Conta Grátis</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[3px]">Comece sua jornada de conhecimento</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-4">

                    {/* Tipo de Conta */}
                    <div className="space-y-1.5 mb-4">
                        <label className={labelClass}>Tipo de Conta</label>
                        <div className="flex gap-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`flex-1 py-3 text-xs font-black uppercase rounded-lg transition-all ${role === 'student' ? 'bg-white text-[#00C402] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Aluno
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={`flex-1 py-3 text-xs font-black uppercase rounded-lg transition-all ${role === 'teacher' ? 'bg-white text-[#00C402] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Professor
                            </button>
                        </div>
                    </div>

                    {/* Nome Completo */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Nome Completo</label>
                        <input
                            type="text"
                            placeholder="SEU NOME COMPLETO"
                            required
                            className={inputClass()}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    {/* E-mail e Senha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
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
                        <div className="space-y-1.5">
                            <label className={labelClass}>Senha</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                className={inputClass()}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CPF/CNPJ e Data de Nascimento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end mb-1">
                                <label className={labelClass}>Documento</label>
                                <div className="flex gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('CPF')}
                                        className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md transition-all ${personType === 'CPF'
                                            ? 'bg-white text-[#00C402] shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        CPF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('CNPJ')}
                                        className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md transition-all ${personType === 'CNPJ'
                                            ? 'bg-white text-[#00C402] shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
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
                                className={inputClass(cpfCnpjTouched && !isCpfCnpjValid)}
                                value={cpfCnpj}
                                onChange={handleCpfCnpjChange}
                                onBlur={() => setCpfCnpjTouched(true)}
                            />
                            {cpfCnpjTouched && !isCpfCnpjValid && (
                                <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">
                                    Por favor, insira um {personType} válido
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
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

                </div>

                <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full bg-[#00C402] hover:bg-[#00A802] text-white font-black uppercase tracking-[2px] p-4 h-16 rounded-2xl transition-all shadow-sm disabled:opacity-50 mt-4 active:scale-95"
                >
                    {loading ? 'PROCESSANDO...' : 'CADASTRAR AGORA'}
                </button>

                {!isFormValid && !loading && (
                    <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2 animate-pulse">
                        Preencha todos os campos corretamente para continuar
                    </p>
                )}

                <div className="mt-10 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-[#00C402] font-black hover:underline underline-offset-4">
                            Entrar na plataforma
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}