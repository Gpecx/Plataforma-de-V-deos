"use client"

import { useCartStore, CartItem } from '@/store/useCartStore'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'

interface AddToCartButtonProps {
    course: CartItem
}

export function AddToCartButton({ course }: AddToCartButtonProps) {
    const { addItem, items } = useCartStore()
    const [isAdded, setIsAdded] = useState(false)

    const isInCart = items.some(item => item.id === course.id)

    const handleAdd = () => {
        addItem(course)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    return (
        <button
            onClick={handleAdd}
            disabled={isInCart}
            className={`w-full font-black uppercase text-[10px] tracking-[2px] py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${isInCart
                    ? 'bg-[#00C402]/20 text-[#00C402] border border-[#00C402]/30 cursor-default'
                    : 'bg-white text-black hover:bg-[#00C402] hover:text-white'
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
