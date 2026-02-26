import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-[#061629] flex items-center justify-center px-6 font-['Exo']">
            <div className="w-full max-w-md space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">

                {/* Cabeçalho */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-full bg-[#00C402]/10 text-[#00C402] mb-2">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Esqueceu a senha?</h2>
                    <p className="text-gray-400">
                        Não se preocupe! Insira seu e-mail abaixo e enviaremos instruções para criar uma nova.
                    </p>
                </div>

                {/* Formulário */}
                <form className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-200">
                            E-mail cadastrado
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00C402] h-12"
                        />
                    </div>

                    <Button className="w-full bg-[#00C402] hover:bg-[#1D5F31] text-black font-bold h-12 text-lg">
                        Enviar link de recuperação
                    </Button>
                </form>

                {/* Voltar para Login */}
                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#00C402] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
}