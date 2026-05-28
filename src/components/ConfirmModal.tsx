"use client"

import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
    loading?: boolean
}

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = 'default',
    loading = false,
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-white w-full max-w-md rounded-lg shadow-xl z-10 border border-black/5"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-md transition-colors text-black/40 hover:text-black"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2 pr-8">
                                <h2 className="text-lg font-bold tracking-tight text-black">
                                    {title}
                                </h2>
                                <p className="text-sm text-black/70 leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex-1 rounded-md px-4 py-2.5 font-bold uppercase text-[10px] tracking-widest transition-all ${variant === 'danger'
                                            ? 'bg-red-500 text-white hover:brightness-110'
                                            : 'bg-[#1D5F31] text-white hover:brightness-110'
                                        } disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 rounded-md px-4 py-2.5 font-bold uppercase text-[10px] tracking-widest bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
