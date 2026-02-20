"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useCartStore } from "@/store/useCartStore"
import type { Course } from "@/data/courses-data"

interface BuyButtonProps {
    course: Course
    size?: "default" | "large"
    label?: string
}

export function BuyButton({ course, size = "default", label = "Comprar Agora" }: BuyButtonProps) {
    const router = useRouter()
    const { addItem } = useCartStore()
    const [loading, setLoading] = useState(false)

    const handleBuy = async () => {
        setLoading(true)
        try {
            // Adiciona ao carrinho primeiro (é persistente)
            addItem({
                id: course.id,
                title: course.title,
                price: course.price,
                image_url: course.image,
            })

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Redireciona para o login e volta para o carrinho
                router.push("/login?next=/cart")
                return
            }

            // Usuário logado: vai direto para o carrinho
            router.push("/cart")
        } finally {
            setLoading(false)
        }
    }

    const baseClass =
        "flex items-center justify-center gap-3 font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(0,196,2,0.3)] bg-[#00C402] text-black hover:bg-white hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"

    const sizeClass =
        size === "large"
            ? "px-14 py-6 text-2xl rounded-full"
            : "px-10 py-5 text-lg"

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className={`${baseClass} ${sizeClass}`}
        >
            {loading ? (
                <Loader2 size={22} className="animate-spin" />
            ) : (
                <ShoppingCart size={22} />
            )}
            {loading ? "Aguarde..." : label}
        </button>
    )
}
