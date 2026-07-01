'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react"
import { auth, db, app } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import { useAuth } from "@/context/AuthProvider"
import { setMfaTrustedCookie, cancelMfaRequestAction } from "@/app/actions/mfa"

interface MFAChallengeProps {
    email: string;
    onVerify: (data?: any) => Promise<void>;
    onCancel: () => void;
}

export default function MFAChallenge({ email, onVerify, onCancel }: MFAChallengeProps) {
    const { setMfaPending } = useAuth()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const isVerifiedRef = useRef(false)
    const isCancelledRef = useRef(false)

    useEffect(() => {
        const handleUnload = () => {
            if (!isVerifiedRef.current && !isCancelledRef.current && auth.currentUser) {
                auth.signOut().catch(console.error);
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('popstate', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('popstate', handleUnload);
            // Removido force signOut no unmount para não quebrar no React Strict Mode
        };
    }, [setMfaPending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length < 6) {
            setError("O código deve ter 6 dígitos")
            return
        }
        
        setLoading(true)
        setError("")
        try {
            const user = auth.currentUser
            if (!user) {
                setError("Sessão expirada. Tente fazer login novamente.")
                setLoading(false)
                return
            }

            // Validar via Callable Function
            const functionsApp = getFunctions(app, 'southamerica-east1');
            const verifyMfa = httpsCallable<{email: string, code: string}, any>(functionsApp, 'verifyEmailCode');
            const result = await verifyMfa({ email, code });
            const data = result.data;
            
            if (!data.success) {
                setError(data.error || "Código de verificação incorreto.");
                setLoading(false);
                return;
            }


            // Salva cookie de dispositivo confiável vinculado ao e-mail (30 dias)
            await setMfaTrustedCookie(email);

            // Redirecionamento (O cleanup do Firestore agora é feito no Backend pelo verifyMfaCode)
            isVerifiedRef.current = true;
            await setMfaPending(false); // Aguarda o cookie 'mfa_pending' ser deletado para o middleware não interceptar
            await onVerify(data); // O onVerify delegará a criação da sessão e o redirect
        } catch (err: unknown) {
            console.error("MFA Verification Error:", err)
            const message = err instanceof Error ? err.message : "Erro na verificação. Tente novamente."
            setError(message)
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        const user = auth.currentUser
        if (user) {
            const idToken = await user.getIdToken();
            await cancelMfaRequestAction(idToken).catch(() => {});
        }
        isCancelledRef.current = true;
        await setMfaPending(false)
        onCancel()
    }

    return (
        <div className="w-full max-w-[450px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#1D5F31]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1D5F31]/20">
                    <ShieldCheck size={32} className="text-[#1D5F31]" />
                </div>
                <h2 className="text-2xl font-bold tracking-tighter uppercase text-[var(--foreground)]">
                    Verificação de Acesso
                </h2>
                <p className="text-green-200 font-bold uppercase text-[9px] tracking-[4px]">
                    Segurança PowerPlay Ativada
                </p>
                <div className="text-sm text-slate-400 mt-4 leading-relaxed">
                    <p>Enviamos um código de 6 dígitos para:</p>
                    <p className="font-bold text-[#1D5F31] mt-1 break-all">{email}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-green-200 ml-1">Código de 6 dígitos</label>
                    <Input
                        className="bg-[#153b1b] border-[#266d35] focus:border-slate-800 focus:ring-0 rounded-xl h-14 text-center text-2xl tracking-[0.5em] font-bold text-[var(--foreground)] placeholder:text-green-700/30 transition-all shadow-none px-5"
                        placeholder="000000"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        disabled={loading}
                    />
                    {error && (
                        <p className="text-[9px] uppercase font-bold text-red-500 text-center mt-2">{error}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full font-bold uppercase tracking-[4px] h-14 rounded-xl shadow-lg transition-all flex items-center justify-center gap-4 bg-[#1D5F31] hover:bg-[#28b828] text-white hover:scale-[1.01] active:scale-[0.99] group mt-2"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            VERIFICAR AGORA
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>

                <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full text-[10px] font-bold uppercase tracking-widest text-[#1D5F31] hover:text-[#28b828] transition-colors mt-2"
                >
                    Cancelar e voltar
                </button>
            </form>
        </div>
    )
}
