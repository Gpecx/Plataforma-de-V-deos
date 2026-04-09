'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/context/AuthProvider"

interface MFAChallengeProps {
    email: string;
    onVerify: () => Promise<void>;
    onCancel: () => void;
}

export default function MFAChallenge({ email, onVerify, onCancel }: MFAChallengeProps) {
    const { setMfaPending } = useAuth()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

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

            // Validar PIN via Documento de Perfil (Manobra Técnica para evitar erro de permissão)
            const profileRef = doc(db, 'profiles', user.uid);
            const profileDoc = await getDoc(profileRef);
            const profileData = profileDoc.data();
            const mfaData = profileData?.mfa_auth_temp;

            if (!mfaData || !mfaData.code) {
                setError("Código não encontrado ou já expirado.");
                setLoading(false);
                return;
            }

            // Validar expiração
            if (Date.now() > mfaData.expiresAt) {
                setError("Este código expirou.");
                setLoading(false);
                return;
            }

            // Validar valor do PIN
            if (mfaData.code !== code) {
                setError("Código de verificação incorreto.");
                setLoading(false);
                return;
            }

            // Sucesso na validação: Limpar dados sensíveis no Firestore
            await updateDoc(profileRef, {
                mfa_auth_temp: null,
                mfaCodeRequested: false
            });

            // Sucesso na validação: Oficializar sessão no Back-end
            console.log("PIN validado com sucesso. Criando sessão...")
            const idToken = await user.getIdToken(true)
            const sessionRes = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });

            if (!sessionRes.ok) {
                throw new Error("Erro ao oficializar sessão no servidor.");
            }

            // Redirecionamento (O cleanup do Firestore agora é feito no Backend pelo verifyMfaCode)
            setMfaPending(false)
            await onVerify()
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
            // Limpa o estado no perfil se o usuário cancelar
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                mfa_auth_temp: null,
                mfaCodeRequested: false
            }).catch(() => {});
        }
        setMfaPending(false)
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
