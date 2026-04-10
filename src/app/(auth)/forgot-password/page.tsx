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
        <div className="min-h-screen bg-transparent flex items-center justify-center px-6 font-montserrat">
            <div className="w-full max-w-xl bg-[#061629] p-12 md:p-16 border-2 border-[#1D5F31] relative overflow-hidden">

                {!isSubmitted ? (
                    <>
                        <div className="text-center space-y-6 relative z-10">
                            <div className="inline-flex p-5 bg-[#061629] text-[#1D5F31] border-2 border-[#1D5F31] mb-4">
                                <KeyRound size={40} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-4xl font-bold text-white tracking-tighter uppercase leading-none">
                                RECUPERAR <span className="text-[#1D5F31]">ACESSO</span>
                            </h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[2px] max-w-sm mx-auto">
                                Insira seu e-mail para restaurarmos suas credenciais PowerPlay.
                            </p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-10 mt-12 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31]">
                                    E-mail Corporativo/Pessoal
                                </label>
                                <Input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="EXEMPLO@POWERPLAY.COM"
                                    className="bg-[#061629] border-2 border-[#1D5F31] text-white rounded-xl h-16 font-bold text-xs uppercase tracking-widest px-8 focus:border-[#1D5F31] focus:ring-0"
                                />
                            </div>

                            <Button
                                disabled={loading}
                                className="w-full bg-[#1D5F31] hover:bg-[#00e602] text-white font-bold uppercase  tracking-[4px] h-16 rounded-xl transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "ENVIAR LINK DE RECUPERAÇÃO"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-[#061629] border-2 border-[#1D5F31] flex items-center justify-center text-[#1D5F31] mb-8">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-2xl font-bold uppercase text-white mb-4">E-MAIL ENVIADO!</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 max-w-md">
                            Verifique sua caixa de entrada para redefinir sua senha com segurança.
                        </p>
                    </div>
                )}

                <div className="text-center mt-12 pt-8 border-t border-[#1D5F31]">
                    <Link href="/login" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[4px] text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> VOLTAR PARA O LOGIN
                    </Link>
                </div>
            </div>
        </div>
    );
}