"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { toggleWishlist, getWishlistCourseIds } from '@/app/actions/wishlist'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

interface WishlistButtonProps {
    courseId: string
    className?: string
    isPurchased?: boolean
}

export default function WishlistButton({ courseId, className = '', isPurchased = false }: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isToggling, setIsToggling] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setIsLoggedIn(!!user)
            if (user) {
                const wishlistIds = await getWishlistCourseIds()
                setIsInWishlist(wishlistIds.includes(courseId))
            }
        })
        return () => unsubscribe()
    }, [courseId])

    if (isPurchased) {
        return null
    }

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!isLoggedIn) {
            window.location.href = '/login'
            return
        }

        setIsToggling(true)
        try {
            const result = await toggleWishlist(courseId)
            setIsInWishlist(result.action === 'added')
        } catch (error) {
            console.error('Erro ao atualizar wishlist:', error)
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            disabled={isToggling}
            className={`absolute top-3 right-3 z-20 p-2.5 rounded-lg border-2 transition-all duration-300 ${
                isInWishlist 
                    ? 'bg-[#1D5F31] border-[#1D5F31] text-white' 
                    : 'bg-black/50 border-white/30 text-white hover:border-[#1D5F31] hover:text-[#1D5F31]'
            } ${className}`}
        >
            <Heart 
                size={16} 
                className={`transition-all ${isInWishlist ? 'fill-current' : ''}`}
            />
        </motion.button>
    )
}