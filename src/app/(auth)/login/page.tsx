'use client' // <--- ESSENCIAL: Adicione isso na primeira linha!
import { Suspense } from 'react'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { useRouter } from "next/navigation" // Importe o router para um redirecionamento suave
import { ArrowRight } from "lucide-react"
import { useSearchParams } from "next/navigation"

const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextRedirect = searchParams.get("next")
    const roleParam = searchParams.get("role") || "student"
    const isTeacherRole = roleParam === "teacher"

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            if (user) {
                const docRef = doc(db, 'profiles', user.uid);
                const docSnap = await getDoc(docRef);
                const profile = docSnap.exists() ? docSnap.data() : null;
                const userRole = profile?.role || 'student';
                const isActualTeacher = userRole === 'teacher' || userRole === 'admin';

                // Validação de Papel (Role Validation)
                if (isTeacherRole && !isActualTeacher) {
                    await auth.signOut();
                    alert("Acesso negado: Esta é uma conta de aluno. Por favor, entre pela Área do Aluno.");
                    return;
                }

                if (!isTeacherRole && isActualTeacher) {
                    await auth.signOut();
                    alert("Acesso negado: Esta é uma conta de professor. Por favor, entre pela Área do Professor.");
                    return;
                }

                // Se houver um redirecionamento pendente (ex: vindo de um link protegido), use-o
                if (nextRedirect) {
                    router.push(nextRedirect)
                } else {
                    if (isActualTeacher) {
                        router.push('/dashboard-teacher')
                    } else {
                        router.push('/dashboard-student')
                    }
                }
                router.refresh()
            }
        } catch (error: any) {
            alert("Erro ao entrar: " + error.message)
        }
    }

    return (
        <div className="w-full">
            <div className="text-center space-y-4 pt-4 pb-8">
                <div className="flex justify-center mb-2">
                    <Link href="/" className="hover:scale-105 transition-transform duration-500 outline-none">
                        <span className={`text-2xl font-black tracking-tighter uppercase ${isTeacherRole ? 'text-slate-900' : 'text-slate-700'}`}>
                            SPCS <span className={isTeacherRole ? 'text-slate-900' : 'text-[#00C402]'}>Academy</span>
                        </span>
                    </Link>
                </div>

                <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-4">
                    <button
                        onClick={() => router.push('/login?role=student')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isTeacherRole ? 'bg-white text-[#00C402] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Área do Aluno
                    </button>
                    <button
                        onClick={() => router.push('/login?role=teacher')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isTeacherRole ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Área do Professor
                    </button>
                </div>

                <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-800">
                    {isTeacherRole ? "Portal do Professor" : "Bem-vindo de volta"}
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[3px]">
                    {isTeacherRole ? "Gerencie seus cursos e alunos" : "Acesse sua área de evolução"}
                </p>
            </div>

            <div className="pb-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-black">E-mail de acesso</FormLabel>
                                    <FormControl>
                                        <Input
                                            className={`bg-slate-50 text-black border-slate-300 focus:ring-2 rounded-xl h-12 text-sm font-medium transition-all ${isTeacherRole ? 'focus:border-slate-900 focus:ring-slate-900/10' : 'focus:border-[#00C402] focus:ring-[#00C402]/10'}`}
                                            placeholder="seu@email.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-black">Senha</FormLabel>
                                        <Link href="/forgot-password" title="Esqueceu a senha?" className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isTeacherRole ? 'text-slate-700' : 'text-[#00C402]'}`}>Recuperar senha</Link>
                                    </div>
                                    <FormControl>
                                        <Input
                                            className={`bg-slate-50 text-black border-slate-300 focus:ring-2 rounded-xl h-12 text-sm transition-all ${isTeacherRole ? 'focus:border-slate-900 focus:ring-slate-900/10' : 'focus:border-[#00C402] focus:ring-[#00C402]/10'}`}
                                            type="password"
                                            placeholder="••••••••"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold" />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className={`w-full font-black uppercase tracking-[2px] h-14 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 group ${isTeacherRole ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-[#00C402] hover:bg-[#00A802] text-white'}`}
                        >
                            {isTeacherRole ? "Acessar Painel" : "Acessar Plataforma"}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>
                </Form>
                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Não tem uma conta? <Link href="/register" className={`font-black hover:underline underline-offset-4 ${isTeacherRole ? 'text-slate-900' : 'text-[#00C402]'}`}>Cadastre-se grátis</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="h-64 flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400">Carregando portal...</div>}>
            <LoginContent />
        </Suspense>
    )
}