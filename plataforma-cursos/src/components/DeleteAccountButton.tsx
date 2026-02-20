"use client"

import { Trash2 } from 'lucide-react'
import { deleteAccount } from '@/app/dashboard-student/actions'

export default function DeleteAccountButton() {
    return (
        <form action={deleteAccount}>
            <button
                type="submit"
                className="px-8 py-4 bg-transparent border border-red-500/30 text-red-500 font-bold uppercase italic rounded-xl hover:bg-red-500 hover:text-white transition-all"
                onClick={(e) => {
                    if (!confirm('Tem certeza absoluta que deseja excluir sua conta? Esta ação é irreversível.')) {
                        e.preventDefault()
                    }
                }}
            >
                Excluir Minha Conta Permanentemente
            </button>
        </form>
    )
}
