"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { resetPasswordAction } from "./actions";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await resetPasswordAction(email);
            
            if (result.success) {
                setIsSubmitted(true);
                toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
            } else {
                toast.error(result.error || "Não foi possível enviar o e-mail. Verifique se o endereço está correto.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro interno. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6 font-montserrat">
            <div className="w-full max-w-xl bg-[#0d1117] p-12 md:p-16 border-2 border-[#00e602] rounded-lg relative overflow-hidden shadow-[0_0_30px_-5px_rgba(0,230,2,0.3)]">

                {!isSubmitted ? (
                    <>
                        <div className="text-center space-y-6 relative z-10">
                            <div className="inline-flex p-5 bg-[#0d1117] border-2 border-[#3b82f6] rounded-lg mb-4 shadow-[0_0_20px_-3px_rgba(59,130,246,0.4)]">
                                <KeyRound size={40} className="text-[#3b82f6]" strokeWidth={2} />
                            </div>
                            <h2 className="text-4xl font-bold text-white tracking-tight uppercase leading-none">
                                RECUPERAR ACESSO
                            </h2>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                Insira seu e-mail para restaurarmos suas credenciais PowerPlay.
                            </p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-8 mt-12 relative z-10">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    E-mail
                                </label>
                                <Input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="bg-[#0d1117] border-2 border-slate-700 text-white rounded-lg h-12 px-4 text-sm placeholder:text-slate-500 focus:border-[#00e602] focus:ring-0 focus-visible:ring-0 focus:shadow-[0_0_12px_-3px_rgba(0,230,2,0.3)]"
                                />
                            </div>

                            <Button
                                disabled={loading}
                                className="w-full bg-[#1a5c2e] hover:bg-[#00e602] text-white font-bold uppercase tracking-wider h-12 rounded-lg transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "ENVIAR LINK DE RECUPERAÇÃO"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-[#0d1117] border-2 border-[#00e602] rounded-lg flex items-center justify-center mb-6 shadow-[0_0_20px_-3px_rgba(0,230,2,0.3)]">
                            <CheckCircle2 size={40} className="text-[#00e602]" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase text-white mb-3">E-MAIL ENVIADO!</h2>
                        <p className="text-sm text-slate-400 max-w-md">
                            Verifique sua caixa de entrada para redefinir sua senha com segurança.
                        </p>
                    </div>
                )}

                <div className="text-center mt-12 pt-6 border-t border-slate-800">
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> VOLTAR PARA O LOGIN
                    </Link>
                </div>
            </div>
        </div>
    );
}