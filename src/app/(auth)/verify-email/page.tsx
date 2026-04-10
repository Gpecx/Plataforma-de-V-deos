"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Loader2, CheckCircle2, RefreshCw } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { reload, sendEmailVerification } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"
import MFAChallenge from "@/components/MFAChallenge"

export default function VerifyEmailPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [isMFAStep, setIsMFAStep] = useState(false)
    const [mfaEmail, setMfaEmail] = useState("")

    const handleResend = async () => {
        setLoading(true)
        try {
            if (!auth.currentUser) {
                toast.error("Sessão não encontrada. Faça login novamente.")
                return
            }
            await sendEmailVerification(auth.currentUser)
            setEmailSent(true)
            toast.success("E-mail de verificação reenviado! Verifique sua caixa de entrada.")
        } catch (error) {
            console.error(error)
            toast.error("Erro interno. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    const handleCheckVerification = async () => {
        if (!auth.currentUser) {
            toast.error("Sessão não encontrada. Faça login novamente.")
            router.push('/login')
            return
        }

        setChecking(true)
        
        try {
            await reload(auth.currentUser)
            
            if (auth.currentUser.emailVerified) {
                // 1. Buscar Perfil para verificar MFA e Role
                const profileRef = doc(db, 'profiles', auth.currentUser.uid);
                const profileDoc = await getDoc(profileRef);
                const profileData = profileDoc.data();

                // 2. Verificar se MFA é necessário
                if (profileData?.mfaEnabled) {
                    console.log("[VerifyEmail] MFA Habilitado. Iniciando desafio...");
                    
                    // Resetar gatilho e ativar
                    await updateDoc(profileRef, { mfaCodeRequested: false });
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await updateDoc(profileRef, { mfaCodeRequested: true });

                    setMfaEmail(auth.currentUser.email || "");
                    setIsMFAStep(true);
                    return;
                }

                // 3. Se não houver MFA, atualizar sessão e redirecionar
                await finalizeSessionAndRedirect(profileData);
            } else {
                toast.error("E-mail ainda não verificado. Clique no link enviado para seu e-mail.")
            }
        } catch (error) {
            console.error("Erro ao verificar:", error)
            toast.error("Erro ao verificar. Tente novamente.")
        } finally {
            setChecking(false)
        }
    }
    const finalizeSessionAndRedirect = async (profileData: any) => {
        if (!auth.currentUser) return;

        try {
            // Sincronizar cookie de sessão com o estado de email_verified: true
            const idToken = await auth.currentUser.getIdToken(true);
            const sessionRes = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });

            if (!sessionRes.ok) {
                throw new Error("Falha ao sincronizar sessão servidor.");
            }

            router.refresh();
            
            // Redirecionamento baseado no papel (role)
            if (profileData?.role === 'teacher' || profileData?.role === 'admin') {
                router.push('/dashboard-teacher/courses');
            } else {
                router.push('/dashboard-student');
            }
        } catch (error) {
            console.error("Erro ao finalizar sessão:", error);
            toast.error("Erro ao sincronizar acesso. Tente entrar novamente.");
        }
    }

    const onVerifyMFA = async () => {
        // Callback quando o MFAChallenge finaliza com sucesso
        const user = auth.currentUser;
        if (!user) return;
        
        const profileRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        await finalizeSessionAndRedirect(profileDoc.data());
    }

    if (isMFAStep) {
        return (
            <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center px-6">
                <MFAChallenge 
                    email={mfaEmail}
                    onVerify={onVerifyMFA}
                    onCancel={() => setIsMFAStep(false)}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center px-6 font-montserrat">
            <div className="w-full max-w-xl bg-[#061629] p-12 md:p-16 border-2 border-[#1D5F31] rounded-2xl relative overflow-hidden">
                <div className="text-center space-y-6 relative z-10">
                    <div className="inline-flex p-5 bg-[#061629] text-[#1D5F31] border-2 border-[#1D5F31] rounded-2xl mb-4">
                        <Mail size={40} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tighter uppercase leading-none">
                        VERIFICAR <span className="text-[#1D5F31]">E-MAIL</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[2px] max-w-sm mx-auto">
                        Enviamos um link de confirmação para seu e-mail. Acesse sua caixa de entrada e clique no link.
                    </p>
                </div>

                <div className="space-y-6 mt-12 relative z-10">
                    <Button
                        onClick={handleResend}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-2 border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white font-bold uppercase tracking-[4px] h-14 rounded-xl transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                REENVIAR E-MAIL
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleCheckVerification}
                        disabled={checking}
                        className="w-full bg-[#1D5F31] hover:bg-[#00e602] text-white font-bold uppercase tracking-[4px] h-14 rounded-xl transition-all flex items-center justify-center gap-3"
                    >
                        {checking ? (
                            <>
                                <Loader2 className="animate-spin" />
                                VERIFICANDO...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                JÁ VERIFIQUEI MEU E-MAIL
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-center mt-12 pt-8 border-t border-[#1D5F31]">
                    <Link href="/login" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[4px] text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> VOLTAR PARA O LOGIN
                    </Link>
                </div>
            </div>
        </div>
    )
}