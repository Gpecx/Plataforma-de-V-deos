"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Loader2, PlayCircle } from "lucide-react"
import { auth } from "@/lib/firebase"
import { useCartStore } from "@/store/useCartStore"
import Link from 'next/link'

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
    purchasedCourseIds?: string[]
}

export function BuyButton({ course, size = "default", label = "Comprar Agora", className = "", purchasedCourseIds = [] }: BuyButtonProps) {
    const router = useRouter()
    const { addItem } = useCartStore()
    const [loading, setLoading] = useState(false)

    const isPurchased = purchasedCourseIds.includes(String(course.id))

    const handleBuy = async () => {
        if (isPurchased) {
            router.push(`/classroom/${course.id}`)
            return
        }

        setLoading(true)
        try {
            // Adiciona ao carrinho usando a estrutura do useCartStore
            addItem({
                id: String(course.id),
                title: course.title,
                price: course.price,
                image_url: course.image_url || course.image,
            })

            const user = auth.currentUser

            if (!user) {
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
        "flex items-center justify-center gap-3 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(0,196,2,0.3)] bg-[#1D5F31] text-black hover:bg-white hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed group"

    const basePurchasedClass =
        "flex items-center justify-center gap-3 font-black uppercase tracking-widest rounded-xl transition-all bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 group"

    const sizeClass =
        size === "large"
            ? "px-14 py-6 text-2xl rounded-xl"
            : "px-10 py-5 text-lg"

    if (isPurchased) {
        return (
            <Link href={`/classroom/${course.id}`} className="w-full">
                <button
                    className={`${basePurchasedClass} ${sizeClass} ${className} w-full`}
                >
                    <PlayCircle size={size === "large" ? 28 : 22} className="group-hover:scale-110 transition-transform" />
                    <span>Acessar Curso</span>
                </button>
            </Link>
        )
    }

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className={`${baseClass} ${sizeClass} ${className}`}
        >
            {loading ? (
                <Loader2 size={22} className="animate-spin text-black" />
            ) : (
                <ShoppingCart size={22} className="group-hover:text-[#1D5F31] transition-colors" />
            )}
            <span>{loading ? "Aguarde..." : label}</span>
        </button>
    )
}
