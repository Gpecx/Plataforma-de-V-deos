"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Loader2 } from 'lucide-react'
import { toggleWishlist } from '@/app/actions/wishlist'

interface RemoveFromWishlistButtonProps {
    courseId: string
    onRemoved?: () => void
}

export default function RemoveFromWishlistButton({ courseId, onRemoved }: RemoveFromWishlistButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleRemove = async () => {
        setIsLoading(true)
        try {
            await toggleWishlist(courseId)
            onRemoved?.()
            window.location.reload()
        } catch (error) {
            console.error('Erro ao remover dos favoritos:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRemove}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 hover:border-red-300 transition-all"
        >
            {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Trash2 size={14} />
            )}
            Remover
        </motion.button>
    )
}