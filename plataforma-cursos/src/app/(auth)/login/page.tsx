'use client'

import { Suspense } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { useSearchParams } from "next/navigation"

const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

function LoginContent() {
    const supabase = createClient()
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            alert("Erro ao entrar: " + error.message)
        } else {
            if (data.user) {
                if (nextRedirect) {
                    router.push(nextRedirect)
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single()

                    if (profile?.role === 'teacher' || profile?.role === 'admin') {
                        router.push('/dashboard-teacher')
                    } else {
                        router.push('/dashboard-student')
                    }
                }
                router.refresh()
            }
        }
    }

    return (
        <div className="w-full">
            <div className="text-center space-y-4 pt-1 pb-6">
                <div className="flex justify-center mb-4">
                    <Link href="/" className="hover:scale-105 transition-transform duration-500 outline-none">
                        <img
                            src="/images/SPCS academy 2.png"
                            alt="SPCS Academy"
                            className="h-16 md:h-20 w-auto object-contain"
                        />
                    </Link>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-900 border-b-4 border-[#00C402] inline-block pb-1">
                        Área de Acesso
                    </h2>
                    <p className="text-slate-900 font-black uppercase text-[9px] tracking-[3px] mt-2">
                        Acesse sua área de evolução e conquistas
                    </p>
                </div>
            </div>

            <div className="pb-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-900">E-mail de acesso</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="bg-white border-2 border-slate-100 focus:ring-2 rounded-xl h-14 text-sm font-bold text-slate-900 transition-all focus:border-[#00C402] focus:ring-[#00C402]/10 placeholder:text-slate-300 shadow-sm"
                                            placeholder="SEU@EMAIL.COM"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-900">Senha</FormLabel>
                                        <Link href="/forgot-password" title="Esqueceu a senha?" className="text-[10px] font-black uppercase tracking-widest hover:underline text-[#00C402]">Recuperar senha</Link>
                                    </div>
                                    <FormControl>
                                        <Input
                                            className="bg-white border-2 border-slate-100 focus:ring-2 rounded-xl h-14 text-sm font-bold text-slate-900 transition-all focus:border-[#00C402] focus:ring-[#00C402]/10 placeholder:text-slate-300 shadow-sm"
                                            type="password"
                                            placeholder="••••••••"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full font-black uppercase tracking-[3px] h-14 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 bg-slate-900 hover:bg-[#00C402] text-white hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            ACESSAR AGORA
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>
                </Form>
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                        Ainda não faz parte? <Link href="/register" className="font-black hover:underline underline-offset-4 text-[#00C402]">Crie sua conta agora</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C402] mx-auto"></div>
                    <p className="text-slate-900 font-black uppercase text-[10px] tracking-[3px]">Carregando portal...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}