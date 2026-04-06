"use client"

import { useCartStore, CartItem } from '@/store/useCartStore'
import { ShoppingCart, Check, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AddToCartButtonProps {
    course: CartItem
    purchasedCourseIds?: string[]
    iconOnly?: boolean
}

export function AddToCartButton({ course, purchasedCourseIds = [], iconOnly = false }: AddToCartButtonProps) {
    const { addItem, items } = useCartStore()
    const [isAdded, setIsAdded] = useState(false)
    const router = useRouter()

    const isPurchased = purchasedCourseIds.includes(course.id)
    const isInCart = items.some(item => item.id === course.id)

    const handleAdd = () => {
        addItem(course)
        setIsAdded(true)
        setTimeout(() => {
            router.push('/cart')
        }, 800)
    }

    if (isPurchased) {
        return (
            <Link href={`/classroom/${course.id}`} className="w-full h-full block">
                <button
                    className="w-full bg-slate-900 text-white font-black uppercase text-[10px] tracking-[2px] py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
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
            title={isInCart ? 'No Carrinho' : 'Adicionar ao Carrinho'}
            className={`${iconOnly ? 'p-2.5' : 'w-full py-3 px-4'} font-black uppercase text-[10px] tracking-[2px] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${isInCart
                ? 'bg-[#1D5F31]/20 text-[#1D5F31] border border-[#1D5F31]/30 cursor-default'
                : 'bg-black text-white hover:bg-[#1D5F31] border border-black hover:border-[#1D5F31]'
                }`}
        >
            {isInCart ? (
                <>
                    <Check size={14} strokeWidth={3} />
                    {!iconOnly && 'No Carrinho'}
                </>
            ) : isAdded ? (
                <>
                    <Check size={14} strokeWidth={3} />
                    {!iconOnly && 'Adicionado!'}
                </>
            ) : (
                <>
                    <ShoppingCart size={14} className="group-hover:rotate-12 transition-transform" />
                    {!iconOnly && 'Adicionar ao Carrinho'}
                </>
            )}
        </button>
    )
}

