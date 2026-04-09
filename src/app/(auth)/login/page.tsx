'use client'

import { Suspense, useState, useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, reload } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import Logo from "@/components/Logo"
import { ConversionBridge } from "@/components/ConversionBridge"
import MFAChallenge from "@/components/MFAChallenge"
import { useAuth } from "@/context/AuthProvider"
import { updateDoc } from "firebase/firestore"

const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get("redirectTo") || searchParams.get("next") || ""
    const isCourseRedirect = redirectTo.startsWith('/course') || redirectTo.startsWith('/classroom') || redirectTo.startsWith('/cart')
    const [showLogin, setShowLogin] = useState(!isCourseRedirect)
    const [mounted, setMounted] = useState(false)
    const [isMFAStep, setIsMFAStep] = useState(false)
    const [mfaEmail, setMfaEmail] = useState("")
    const { setMfaPending } = useAuth()

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        console.log("Iniciando login para:", values.email)
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password)
            const user = userCredential.user
            console.log("Login de e-mail/senha bem sucedido. Verificando MFA...")

            // Interceptação MFA Customizada
            // Pequeno atraso para garantir que as permissões do Auth propaguem para o Firestore
            await new Promise(resolve => setTimeout(resolve, 500));
            const profileRef = doc(db, 'profiles', user.uid);
            const profileDoc = await getDoc(profileRef);
            const profileData = profileDoc.data();

            if (profileData?.mfaEnabled) {
                console.log("MFA Habilitado! Garantindo transição false → true no gatilho...");
                
                // CORREÇÃO: Resetar para false ANTES de ativar.
                // Se o campo já era 'true' (tentativa anterior sem limpeza), o Firestore
                // não detectaria mudança, e o PIN não seria gerado.
                await updateDoc(profileRef, { mfaCodeRequested: false });
                
                // Pequeno delay para garantir que a escrita anterior chegou ao Firestore
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Agora ativa o gatilho com transição garantida: false → true
                await updateDoc(profileRef, { mfaCodeRequested: true });

                // Bloqueia o estado global e mostra o desafio
                setMfaPending(true);
                setMfaEmail(user.email || "");
                setIsMFAStep(true);
                return;
            }

            console.log("MFA não habilitado. Seguindo com o login...");
            setMfaPending(false);
            await handleLoginSuccess(user);
        } catch (error: any) {
            console.log("Erro no login:", error.code)
            /* 
            // MFA Nativo Comentado conforme requisito
            if (error.code === 'auth/multi-factor-auth-required') {
                const resolver = getMultiFactorResolver(auth, error)
                setMfaResolver(resolver)
                setIsMFAStep(true)
                return
            }
            */
            handleLoginError(error)
        }
    }

    async function onVerifyMFA() {
        // A lógica de verificação foi movida para dentro do componente MFAChallenge.tsx
        // pois ele agora valida diretamente contra o Firestore.
        // O MFAChallenge chamará handleLoginSuccess após validar o PIN.
        const user = auth.currentUser
        if (user) {
            await handleLoginSuccess(user)
        }
    }

    async function handleLoginSuccess(user: any) {
        try {
            await reload(user)
            console.log('Email verified:', user.emailVerified)

            if (!user.emailVerified) {
                await auth.signOut()
                router.push('/verify-email')
                return
            }

            console.log('Redirecting to dashboard...')

            const idToken = await user.getIdToken(true)
            const sessionRes = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });

            if (!sessionRes.ok) {
                const errorData = await sessionRes.json()
                if (errorData.error === "EMAIL_NOT_VERIFIED") {
                    await auth.signOut()
                    router.push('/verify-email')
                    return
                }
                throw new Error("session_creation_failed");
            }

            router.refresh()

            if (redirectTo) {
                window.location.href = redirectTo
                return
            }

            const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
            const profileData = profileDoc.data()

            if (profileData?.role === 'teacher' || profileData?.role === 'admin') {
                router.push('/dashboard-teacher/courses')
            } else if (profileData?.role === 'student') {
                router.push('/course')
            } else {
                router.push('/course')
            }
        } catch (error) {
            handleLoginError(error)
        }
    }

    function handleLoginError(error: any) {
        console.error("Erro ao entrar:", error)
        let errorMessage = "Erro ao fazer login. Tente novamente";
        if (error.message === "session_creation_failed") {
            errorMessage = "Erro ao iniciar sessão. Tente novamente.";
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = "E-mail ou senha incorretos.";
        } else if (error.message) {
            errorMessage = "Erro ao entrar: " + error.message;
        }
        alert(errorMessage)
    }

    if (!mounted) {
        return null
    }

    if (isCourseRedirect && !showLogin) {
        return (
            <ConversionBridge 
                redirectTo={redirectTo || undefined} 
                onShowLogin={() => setShowLogin(true)} 
            />
        )
    }

    return (
        <div className="min-h-screen w-full flex flex-row bg-[var(--background-color)] overflow-hidden">
            {/* Left Side - Visual (Full Column Image) */}
            <div className="hidden md:flex md:w-1/2 bg-[var(--background-color)] items-center justify-center p-0 overflow-hidden">
                <div className="w-full h-full relative">
                    <img
                        src="/login-illustration.png"
                        alt="PowerPlay"
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            </div>

            {/* Right Side - PowerPlay Form Area (Positioned Higher) */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-start pt-8 md:pt-12 lg:pt-16 p-6 md:p-12 bg-[var(--background-color)] relative">
                <div className="w-full max-w-[450px] flex flex-col items-center">
                    {/* Logo Section (Smaller and closer) */}
                    <div className="mb-4 text-center">
                        <Logo variant="vertical" className="scale-100 md:scale-110 mb-2" />
                        <div className="space-y-1">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase text-[var(--foreground)]">
                                Área de Acesso
                            </h2>
                            <p className="text-green-200 font-bold uppercase text-[9px] tracking-[4px]">
                                Evolução e Conquistas
                            </p>
                        </div>
                    </div>

                    {/* Content Section (Compact) */}
                    <div className="w-full">
                        {isMFAStep ? (
                            <MFAChallenge 
                                email={mfaEmail}
                                onVerify={onVerifyMFA} 
                                onCancel={() => setIsMFAStep(false)} 
                            />
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-green-200 ml-1">E-mail de acesso</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-[#153b1b] border-[#266d35] focus:border-slate-800 focus:ring-0 rounded-xl h-14 text-sm font-bold text-[var(--foreground)] placeholder:text-green-700 transition-all shadow-none px-5"
                                                        placeholder="SEU@EMAIL.COM"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px] uppercase font-bold text-red-600" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <div className="flex items-center justify-between ml-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-green-200">Senha</FormLabel>
                                                    <Link href="/forgot-password" title="Esqueceu a senha?" className="text-[9px] font-bold uppercase tracking-widest hover:underline text-green-200">Recuperar senha</Link>
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        className="bg-[#153b1b] border-[#266d35] focus:border-slate-800 focus:ring-0 rounded-xl h-14 text-sm font-bold text-[var(--foreground)] placeholder:text-green-700 transition-all shadow-none px-5"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px] uppercase font-bold text-red-600" />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full font-bold uppercase tracking-[4px] h-14 rounded-xl shadow-lg transition-all flex items-center justify-center gap-4 bg-[#1D5F31] hover:bg-[#28b828] text-white hover:scale-[1.01] active:scale-[0.99] group mt-2"
                                    >
                                        ENTRAR AGORA
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </Form>
                        )}

                        {/* Footer Links (Closer) */}
                        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                            <p className="text-[11px] text-green-200 font-bold uppercase tracking-widest">
                                Não tem uma conta? <Link href="/register" className="font-bold text-[#1D5F31] hover:underline underline-offset-8 ml-2">Crie agora</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full min-h-screen flex items-center justify-center p-8 bg-[var(--background-color)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D5F31] mx-auto"></div>
                    <p className="text-[var(--foreground)] font-bold uppercase text-[10px] tracking-[3px]">Carregando portal...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}