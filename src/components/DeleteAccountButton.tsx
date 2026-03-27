"use client"

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '@/app/(app)/dashboard-student/settings/actions'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { useCartStore } from '@/store/useCartStore'

export default function DeleteAccountButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const showNotification = useCartStore(state => state.showNotification)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteAccount()
            if (result && !result.success) {
                showNotification(result.error || 'Erro ao excluir conta', 'error')
                setLoading(false)
                setIsModalOpen(false)
            }
        } catch (error) {
            showNotification('Erro interno ao processar exclusão', 'error')
            setLoading(false)
            setIsModalOpen(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-transparent border border-red-500/30 text-red-500 font-bold uppercase italic rounded-xl hover:bg-red-500 hover:text-white transition-all w-fit"
            >
                Excluir Minha Conta Permanentemente
            </button>

            <ConfirmDeleteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                loading={loading}
            />
        </>
    )
}

