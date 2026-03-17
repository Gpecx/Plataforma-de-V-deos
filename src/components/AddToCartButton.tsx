"use client"

import { useCartStore, CartItem } from '@/store/useCartStore'
import { ShoppingCart, Check, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AddToCartButtonProps {
    course: CartItem
    purchasedCourseIds?: string[]
}

export function AddToCartButton({ course, purchasedCourseIds = [] }: AddToCartButtonProps) {
    const { addItem, items } = useCartStore()
    const [isAdded, setIsAdded] = useState(false)

    const isPurchased = purchasedCourseIds.includes(course.id)
    const isInCart = items.some(item => item.id === course.id)

    const handleAdd = () => {
        addItem(course)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    if (isPurchased) {
        return (
            <Link href={`/classroom/${course.id}`} className="w-full h-full block">
                <button
                    className="w-full bg-slate-900 text-white font-black uppercase text-[10px] tracking-[2px] py-3 rounded-none hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                    <PlayCircle size={14} className="group-hover:scale-110 transition-transform" />
                    Acessar Curso
                </button>
            </Link>
        )
    }

    return (
        <button
            onClick={handleAdd}
            disabled={isInCart}
            className={`w-full font-black uppercase text-[10px] tracking-[2px] py-3 rounded-none transition-all shadow-lg flex items-center justify-center gap-2 group ${isInCart
                ? 'bg-[#1D5F31]/20 text-[#1D5F31] border border-[#1D5F31]/30 cursor-default'
                : 'bg-white text-black hover:bg-[#1D5F31] hover:text-white'
                }`}
        >
            {isInCart ? (
                <>
                    <Check size={14} strokeWidth={3} />
                    No Carrinho
                </>
            ) : isAdded ? (
                <>
                    <Check size={14} strokeWidth={3} />
                    Adicionado!
                </>
            ) : (
                <>
                    <ShoppingCart size={14} className="group-hover:rotate-12 transition-transform" />
                    Adicionar ao Carrinho
                </>
            )}
        </button>
    )
}

