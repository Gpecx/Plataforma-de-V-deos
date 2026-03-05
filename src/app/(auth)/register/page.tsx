'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateDocument, maskCPF, maskCNPJ } from '@/lib/document-utils'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [docType, setDocType] = useState<'cpf' | 'cnpj'>('cpf')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateDocument(cpfCnpj)) {
            alert("CPF ou CNPJ inválido. Por favor, verifique os números digitados.")
            return
        }

        setLoading(true)

        try {
            // 1. Cria o usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                // 2. Insere o nome e doc na coleção profiles
                await setDoc(doc(db, 'profiles', user.uid), {
                    full_name: fullName,
                    birth_date: birthDate,
                    cpf_cnpj: cpfCnpj.replace(/\D/g, ''), // Salva apenas os números
                    role: role,
                    created_at: new Date().toISOString()
                });

                // Redirecionamento baseado no cargo
                if (role === 'teacher') {
                    router.push('/dashboard-teacher')
                } else {
                    router.push('/dashboard-student')
                }
                router.refresh()
            }
        } catch (error: any) {
            alert('Erro no cadastro: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="text-center space-y-4 pt-4 pb-10">
                <div className="flex justify-center mb-2">
                    <Link href="/" className="hover:scale-105 transition-transform duration-500">
                        <span className="text-2xl font-black tracking-tighter uppercase text-slate-700">
                            SPCS <span className="text-[#00C402]">Academy</span>
                        </span>
                    </Link>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-700">Criar Conta Grátis</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[3px]">Comece sua jornada de conhecimento</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
                <div className="flex gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${role === 'student' ? 'bg-[#00C402] text-white border-[#00C402]' : 'bg-slate-50 text-black border-slate-300 hover:border-slate-400'}`}
                    >
                        Sou Aluno
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`flex-1 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${role === 'teacher' ? 'bg-[#00C402] text-white border-[#00C402]' : 'bg-slate-50 text-black border-slate-300 hover:border-slate-400'}`}
                    >
                        Sou Professor
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black">Nome Completo</label>
                            <input
                                type="text" placeholder="SEU NOME COMPLETO" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-black border border-slate-300 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black">Data de Nascimento</label>
                            <input
                                type="date" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-black border border-slate-300 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end md:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black">Documento</label>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-1 text-[10px] font-bold text-black uppercase cursor-pointer">
                                        <input type="radio" checked={docType === 'cpf'} onChange={() => { setDocType('cpf'); setCpfCnpj(''); }} className="accent-[#00C402]" /> CPF
                                    </label>
                                    <label className="flex items-center gap-1 text-[10px] font-bold text-black uppercase cursor-pointer">
                                        <input type="radio" checked={docType === 'cnpj'} onChange={() => { setDocType('cnpj'); setCpfCnpj(''); }} className="accent-[#00C402]" /> CNPJ
                                    </label>
                                </div>
                            </div>
                            <input
                                type="text" placeholder={docType === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"} required
                                value={cpfCnpj}
                                className="w-full p-4 rounded-xl bg-slate-50 text-black border border-slate-300 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                                onChange={(e) => setCpfCnpj(docType === 'cpf' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))}
                                maxLength={docType === 'cpf' ? 14 : 18}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black">E-mail</label>
                            <input
                                type="email" placeholder="seu@email.com" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-black border border-slate-300 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black">Senha</label>
                            <input
                                type="password" placeholder="••••••••" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-black border border-slate-300 focus:border-[#00C402] outline-none text-sm transition-all"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-[#00C402] hover:bg-[#00A802] text-white font-black uppercase tracking-[2px] p-4 h-16 rounded-2xl transition-all shadow-sm disabled:opacity-50 mt-4"
                >
                    {loading ? 'PROCESSANDO...' : 'CADASTRAR AGORA'}
                </button>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Já tem uma conta? <Link href="/login" className="text-[#00C402] font-black hover:underline underline-offset-4">Entrar na plataforma</Link>
                    </p>
                </div>
            </form>
        </div>
    )
}