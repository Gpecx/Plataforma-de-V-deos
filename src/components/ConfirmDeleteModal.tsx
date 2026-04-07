"use client"

import { X, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    loading?: boolean
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, loading = false }: ConfirmDeleteModalProps) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden z-10 border border-slate-100"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 md:p-10 space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                                    <AlertTriangle size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tighter uppercase text-slate-900 leading-none">
                                        Excluir <span className="text-red-500">Conta?</span>
                                    </h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px]">Esta ação é irreversível.</p>
                                </div>
                            </div>

                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 space-y-3">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider leading-relaxed text-center">
                                    Ao confirmar, você perderá acesso definitivo a:
                                </p>
                                <ul className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 space-y-2 flex flex-col items-center">
                                    <li>• Todos os seus treinamentos</li>
                                    <li>• Certificados emitidos</li>
                                    <li>• Histórico de aprendizado</li>
                                </ul>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white h-14 rounded-2xl font-bold uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-200"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                    Confirmar Exclusão
                                </Button>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl font-bold uppercase tracking-[2px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
