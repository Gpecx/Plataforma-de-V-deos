"use client"

import { useCartStore, CartItem } from '@/store/useCartStore'
import { ShoppingCart, ArrowRight, Check, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CourseActionButtonProps {
    courseId: string
    courseTitle: string
    coursePrice: number
    courseImageUrl?: string
    purchasedCourseIds?: string[]
    isAdmin?: boolean
}

export function CourseActionButton({
    courseId,
    courseTitle,
    coursePrice,
    courseImageUrl,
    purchasedCourseIds = [],
    isAdmin = false,
}: CourseActionButtonProps) {
    const { addItem, items } = useCartStore()
    const router = useRouter()
 
    const isPurchased = purchasedCourseIds.includes(courseId)
    const hasAccess = isAdmin || isPurchased
    const isInCart = items.some((item) => item.id === courseId)
 
    // Aluno já comprou ou é Admin: botão "Acessar Treinamento"
    if (hasAccess) {
        return (
            <button
                onClick={() => router.push(`/classroom/${courseId}`)}
                style={{ borderRadius: '0px' }}
                className="btn-cta w-full flex items-center justify-center gap-3 group py-5 shadow-2xl shadow-[#1D5F31]/20 !text-white"
            >
                <span className="relative z-10 flex items-center gap-3 text-[11px] tracking-[4px] !text-white">
                    <PlayCircle size={18} className="!text-white" />
                    ACESSAR TREINAMENTO
                </span>
            </button>
        )
    }

    // Já está no carrinho: botão "IR AO CARRINHO"
    if (isInCart) {
        return (
            <button
                onClick={() => router.push('/cart')}
                style={{ borderRadius: '0px' }}
                className="w-full flex items-center justify-center gap-3 group py-5 bg-[#1D5F31]/10 border-2 border-[#1D5F31] text-[#1D5F31] font-bold uppercase text-[11px] tracking-[4px] shadow-lg transition-all hover:bg-[#1D5F31] hover:text-white"
            >
                <Check size={16} strokeWidth={3} />
                IR AO CARRINHO
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        )
    }

    // Default: botão "Adicionar ao Carrinho"
    const handleAddToCart = () => {
        const item: CartItem = {
            id: courseId,
            title: courseTitle,
            price: coursePrice,
            image_url: courseImageUrl,
        }
        addItem(item)
        // Pequeno delay para o usuário ver o toast antes de navegar
        setTimeout(() => {
            router.push('/cart')
        }, 800)
    }

    return (
        <button
            onClick={handleAddToCart}
            style={{ borderRadius: '0px' }}
            className="btn-cta w-full flex items-center justify-center gap-3 group py-5 shadow-2xl shadow-[#1D5F31]/20 !text-white transition-all hover:scale-[1.02]"
        >
            <span className="relative z-10 flex items-center gap-3 text-[11px] tracking-[4px] !text-white">
                <ShoppingCart size={16} className="group-hover:rotate-12 transition-transform !text-white" />
                ADICIONAR AO CARRINHO
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform !text-white" />
            </span>
        </button>
    )
}
