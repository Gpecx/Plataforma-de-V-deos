'use client' // <--- ESSENCIAL: Adicione isso na primeira linha!

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation" // Importe o router para um redirecionamento suave

const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

import { useSearchParams } from "next/navigation"

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextRedirect = searchParams.get("next")

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
                // Se houver um redirecionamento pendente, use-o
                if (nextRedirect) {
                    router.push(nextRedirect)
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single()

                    if (profile?.role === 'teacher') {
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
        // ... seu código de retorno permanece o mesmo ...
        <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
            {/* Mantive o restante do seu JSX igual */}
            <Card className="w-full max-w-md border-none shadow-2xl bg-gray-900 text-white">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <span className="text-3xl font-black italic tracking-tighter uppercase">
                            CURSOS <span className="text-brand-green">EXS</span>
                        </span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                    <CardDescription className="text-gray-400">Acesse sua área de aluno</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl><Input className="bg-gray-800 border-gray-700" placeholder="seu@email.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Senha</FormLabel>
                                            <Link href="/forgot-password" title="Esqueceu a senha?" className="text-sm text-brand-green hover:underline">Esqueceu a senha?</Link>
                                        </div>
                                        <FormControl><Input className="bg-gray-800 border-gray-700" type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-brand-green hover:bg-green-600 text-brand-dark font-bold py-6">
                                Entrar na Plataforma
                            </Button>
                        </form>
                    </Form>
                    <p className="mt-4 text-center text-sm text-gray-400">
                        Não tem uma conta? <Link href="/register" className="text-brand-green font-bold hover:underline">Cadastre-se grátis</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}