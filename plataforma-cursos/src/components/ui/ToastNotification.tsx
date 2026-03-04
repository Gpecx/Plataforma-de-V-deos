"use client"

import { useCartStore } from "@/store/useCartStore"
import { motion, AnimatePresence } from "framer-motion"
import { Info, CheckCircle2, XCircle, X } from "lucide-react"
import { useEffect } from "react"

export function ToastNotification() {
    const { notification, hideNotification } = useCartStore()

    if (!notification) return null

    const icons = {
        info: <Info className="text-blue-500" size={20} />,
        success: <CheckCircle2 className="text-[#00C402]" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
    }

    const bgColors = {
        info: "bg-blue-50/90 border-blue-100",
        success: "bg-[#00C402]/10 border-[#00C402]/20",
        error: "bg-red-50/90 border-red-100",
    }

    return (
        <AnimatePresence>
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`pointer-events-auto backdrop-blur-md border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 ${bgColors[notification.type]}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-xl shadow-sm">
                                {icons[notification.type]}
                            </div>
                            <p className="text-sm font-black uppercase tracking-tight text-slate-800 leading-tight">
                                {notification.message}
                            </p>
                        </div>
                        <button
                            onClick={hideNotification}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
