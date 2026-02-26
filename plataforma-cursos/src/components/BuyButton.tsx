"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useCartStore } from "@/store/useCartStore"

// Ajustamos a interface para aceitar tanto o mock quanto o banco
interface BuyButtonProps {
    course: {
        id: string | number
        title: string
        price: number
        image?: string // caso venha do mock
        image_url?: string // caso venha do banco
    }
    size?: "default" | "large"
    label?: string
    className?: string
}

export function BuyButton({ course, size = "default", label = "Comprar Agora", className = "" }: BuyButtonProps) {
    const router = useRouter()
    const { addItem } = useCartStore()
    const [loading, setLoading] = useState(false)

    const handleBuy = async () => {
        setLoading(true)
        try {
            // Adiciona ao carrinho usando a estrutura do useCartStore
            addItem({
                id: String(course.id), // Forçamos string para o UUID do Supabase
                title: course.title,
                price: course.price,
                image_url: course.image_url || course.image, // Pega qualquer um que estiver disponível
            })

            const supabase = createClient()

            // Verificamos a sessão de forma mais rápida
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Redireciona para o login e salva a intenção de ir para o cart
                router.push("/login?next=/cart")
                return
            }

            // Usuário logado: vai direto para o carrinho
            router.push("/cart")
        } catch (error) {
            console.error("Erro ao processar compra:", error)
        } finally {
            setLoading(false)
        }
    }

    const baseClass =
        "flex items-center justify-center gap-3 font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(0,196,2,0.3)] bg-[#00C402] text-black hover:bg-white hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed group"

    const sizeClass =
        size === "large"
            ? "px-14 py-6 text-2xl rounded-full"
            : "px-10 py-5 text-lg"

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className={`${baseClass} ${sizeClass} ${className}`}
        >
            {loading ? (
                <Loader2 size={22} className="animate-spin text-black" />
            ) : (
                <ShoppingCart size={22} className="group-hover:text-[#00C402] transition-colors" />
            )}
            <span>{loading ? "Aguarde..." : label}</span>
        </button>
    )
}