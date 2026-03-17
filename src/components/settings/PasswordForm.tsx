"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordChangeSchema, PasswordChangeInput } from "@/lib/validations/auth";
import { useChangePassword } from "@/hooks/use-change-password";
import { Loader2, KeyRound } from "lucide-react";

export const PasswordForm = () => {
    const { changePassword, isLoading } = useChangePassword();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordChangeInput>({
        resolver: zodResolver(PasswordChangeSchema),
    });

    const onSubmit = async (data: PasswordChangeInput) => {
        const success = await changePassword(data);
        if (success) reset();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Senha Atual */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 px-1">Senha Atual</label>
                    <div className="relative group">
                        <Input
                            {...register("currentPassword")}
                            type="password"
                            placeholder="••••••••"
                            className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    {errors.currentPassword && (
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1 animate-in fade-in slide-in-from-top-1">
                            {errors.currentPassword.message}
                        </p>
                    )}
                </div>

                {/* Nova Senha */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 px-1">Nova Senha</label>
                    <div className="relative group">
                        <Input
                            {...register("newPassword")}
                            type="password"
                            placeholder="Mín. 8 caracteres"
                            className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    {errors.newPassword && (
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1 animate-in fade-in slide-in-from-top-1">
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 px-1">Confirmar Senha</label>
                    <div className="relative group">
                        <Input
                            {...register("confirmPassword")}
                            type="password"
                            placeholder="Repita a senha"
                            className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1 animate-in fade-in slide-in-from-top-1">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="outline"
                    className="border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-900 h-14 px-8 rounded-2xl font-black uppercase tracking-[2px] text-[10px] transition-all gap-3 overflow-hidden group/btn"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#1D5F31]" size={18} />
                    ) : (
                        <KeyRound className="group-hover/btn:rotate-12 transition-transform text-slate-300 group-hover/btn:text-[#1D5F31]" size={18} />
                    )}
                    {isLoading ? "Processando..." : "Sincronizar Acesso"}
                </Button>
            </div>
        </form>
    );
};
