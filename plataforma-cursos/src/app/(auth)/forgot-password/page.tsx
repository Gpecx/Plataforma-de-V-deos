import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center px-6 font-exo border-t border-slate-100">
            <div className="w-full max-w-md space-y-10 bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-700">

                {/* Cabeçalho */}
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-3xl bg-slate-50 text-[#00C402] border border-slate-100 shadow-sm mb-2">
                        <KeyRound size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Esqueceu a senha?</h2>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed px-4">
                        Não se preocupe! Insira seu e-mail abaixo e enviaremos instruções estrategicamente para criar uma nova credencial.
                    </p>
                </div>

                {/* Formulário */}
                <form className="space-y-8">
                    <div className="space-y-3">
                        <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">
                            E-mail Corporativo/Pessoal
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="exemplo@spcs.com"
                            className="bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 h-14 rounded-2xl font-bold text-sm px-6 transition-all"
                        />
                    </div>

                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[3px] h-14 rounded-2xl shadow-xl shadow-slate-200 transition-all text-[11px]">
                        Enviar link de recuperação
                    </Button>
                </form>

                {/* Voltar para Login */}
                <div className="text-center pt-4 border-t border-slate-50">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
}