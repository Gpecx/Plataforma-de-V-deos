"use client"

import { useCartStore, CartItem } from '@/store/useCartStore'
import { ShoppingCart, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface AddToCartButtonProps {
    course: CartItem
}

export function AddToCartButton({ course }: AddToCartButtonProps) {
    const { addItem, items } = useCartStore()
    const [isAdded, setIsAdded] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const { user } = useAuth()

    const isInCart = items.some(item => item.id === course.id)

    useEffect(() => {
        async function checkEnrollment() {
            if (user && course.id) {
                try {
                    const q = query(collection(db, 'enrollments'),
                        where('user_id', '==', user.uid),
                        where('course_id', '==', course.id)
                    )
                    const snap = await getDocs(q)
                    setIsEnrolled(!snap.empty)
                } catch (error) {
                    console.error("Error checking enrollment in AddToCart:", error)
                }
            } else {
                setIsEnrolled(false)
            }
        }
        checkEnrollment()
    }, [user, course.id])

    const handleAdd = () => {
        addItem(course)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    if (isEnrolled) {
        return (
            <button
                disabled
                className="w-full font-black uppercase text-[10px] tracking-[2px] py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            >
                <Check size={14} strokeWidth={3} />
                Treinamento Adquirido
            </button>
        )
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
