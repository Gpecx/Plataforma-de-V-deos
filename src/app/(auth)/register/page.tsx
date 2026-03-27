'use client'

import { useState, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { createProfile, getAddressByCep } from './actions'
import Logo from '@/components/Logo'
import { UserPlus, User, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react'

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
    const [fullName, setFullName] = useState('')
    const [personType, setPersonType] = useState<'CPF' | 'CNPJ'>('CPF')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [loading, setLoading] = useState(false)
    const [cpfCnpjTouched, setCpfCnpjTouched] = useState(false)

    // Novos estados de endereço
    const [cep, setCep] = useState('')
    const [rua, setRua] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [bairro, setBairro] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [isCepLoading, setIsCepLoading] = useState(false)
    const [cepError, setCepError] = useState('')

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
            isBirthDateValid &&
            cep.length === 9 &&
            rua.length > 2 &&
            numero.length > 0 &&
            cidade.length > 2 &&
            estado.length === 2
    }, [email, password, fullName, isCpfCnpjValid, isBirthDateValid, cep, rua, numero, cidade, estado])

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
                role,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            const idToken = await user.getIdToken()
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

            if (role === 'teacher') {
                router.push('/dashboard-teacher')
            } else {
                router.push('/dashboard-student')
            }
        } catch (error: any) {
            console.error('Erro no cadastro:', error)
            alert('Erro no cadastro: ' + (error.message || 'Verifique os dados e tente novamente.'))
        } finally {
            setLoading(false)
        }
    }

    const inputClass = (hasError: boolean = false) =>
        `w-full p-4 bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all outline-none text-sm font-medium placeholder:text-gray-400 focus:border-gray-500 focus:bg-white rounded-xl ${hasError
            ? 'border-red-500 focus:border-red-600'
            : ''
        }`

    const sectionTitleClass = 'text-gray-400 text-xs uppercase tracking-widest font-bold mb-4 block'
    const labelClass = 'text-[9px] font-black uppercase tracking-widest text-green-200/60 mb-1 block'

    return (
        <div className="min-h-screen w-full flex flex-row bg-[var(--background-color)] overflow-hidden font-exo">
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
                    <div className="text-center space-y-4 mb-10">
                        <div className="flex justify-center mb-4">
                            <Logo variant="vertical" className="scale-110" />
                        </div>
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-white">Alta Performance</h2>
                            <p className="text-[#1D5F31] font-bold uppercase text-[9px] tracking-[4px] mt-2 opacity-80">Crie sua conta industrial</p>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="bg-transparent p-0 border-t border-white/5">
                        <form onSubmit={handleRegister} className="space-y-10 py-8">

                            {/* Grupo 1: Dados de Acesso */}
                            <section>
                                <span className={sectionTitleClass}>Grupo 1: Dados de Acesso</span>
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
                                </div>
                            </section>

                            {/* Grupo 2: Identificação */}
                            <section>
                                <span className={sectionTitleClass}>Grupo 2: Identificação</span>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-7 space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className={labelClass}>Documento</label>
                                            <div className="flex gap-1 bg-[#153b1b] p-0.5 border border-[#266d35]">
                                                {['CPF', 'CNPJ'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => handleTypeChange(type as 'CPF' | 'CNPJ')}
                                                        className={`px-3 py-1 text-[8px] font-black uppercase transition-all ${personType === type
                                                            ? 'bg-[#1D5F31] text-white shadow'
                                                            : 'text-green-700 hover:text-green-200'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
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
                                    </div>
                                    <div className="col-span-12 md:col-span-5 space-y-1">
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
                            </section>

                            {/* Grupo 3: Endereço */}
                            <section>
                                <span className={sectionTitleClass}>Grupo 3: Endereço (Otimizado)</span>
                                <div className="space-y-4">
                                    {/* Linha 1: CEP e Rua */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-12 md:col-span-5 space-y-1">
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
                                                        <div className="animate-spin h-4 w-4 border-t-2 border-green-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                            {cepError && (
                                                <div className="flex items-center gap-1 mt-1 text-orange-400">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[9px] font-bold uppercase">{cepError}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-12 md:col-span-7 space-y-1">
                                            <label className={labelClass}>Rua/Logradouro</label>
                                            <input
                                                type="text"
                                                placeholder="AV. INDUSTRIAL"
                                                required
                                                className={inputClass()}
                                                value={rua}
                                                onChange={(e) => setRua(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Linha 2: Número, Complemento e Bairro */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-4 md:col-span-3 space-y-1">
                                            <label className={labelClass}>Número</label>
                                            <input
                                                ref={numberInputRef}
                                                type="text"
                                                placeholder="000"
                                                required
                                                className={inputClass()}
                                                value={numero}
                                                onChange={(e) => setNumero(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-8 md:col-span-4 space-y-1">
                                            <label className={labelClass}>Complemento</label>
                                            <input
                                                type="text"
                                                placeholder="APTO/SALA"
                                                className={inputClass()}
                                                value={complemento}
                                                onChange={(e) => setComplemento(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-5 space-y-1">
                                            <label className={labelClass}>Bairro</label>
                                            <input
                                                type="text"
                                                placeholder="BAIRRO"
                                                required
                                                className={inputClass()}
                                                value={bairro}
                                                onChange={(e) => setBairro(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Linha 3: Cidade e Estado */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-8 md:col-span-9 space-y-1">
                                            <label className={labelClass}>Cidade</label>
                                            <input
                                                type="text"
                                                placeholder="CIDADE"
                                                required
                                                className={inputClass()}
                                                value={cidade}
                                                onChange={(e) => setCidade(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-3 space-y-1">
                                            <label className={labelClass}>Estado/UF</label>
                                            <input
                                                type="text"
                                                placeholder="UF"
                                                required
                                                maxLength={2}
                                                className={inputClass()}
                                                value={estado}
                                                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="group relative w-full overflow-hidden bg-[#1D5F31] hover:bg-[#28b828] text-white font-black uppercase tracking-[3px] py-5 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-4 rounded-xl active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3 text-sm">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            SINCRONIZANDO...
                                        </span>
                                    ) : (
                                        <>
                                            CONCLUIR CADASTRO
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>

                            <div className="pt-6 border-t border-white/5 text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                                    Ao se cadastrar, você concorda com nossos <br />
                                    <span className="text-white cursor-pointer hover:underline">Termos de Uso</span> e <span className="text-white cursor-pointer hover:underline">Privacidade</span>
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    Já possui acesso?{' '}
                                    <Link href="/login" className="text-[#1D5F31] font-black hover:text-[#28b828] transition-colors underline underline-offset-4">
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
