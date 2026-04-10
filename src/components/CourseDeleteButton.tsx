'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { deleteCourse } from '@/app/actions/admin'

interface CourseDeleteButtonProps {
    courseId: string
    courseTitle: string
}

export default function CourseDeleteButton({ courseId, courseTitle }: CourseDeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        const confirmMessage = `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nO curso "${courseTitle}" e TODAS as suas aulas serão excluídos permanentemente.\n\nDeseja continuar?`
        
        if (!confirm(confirmMessage)) return

        setIsDeleting(true)
        try {
            const result = await deleteCourse(courseId)
            if (!result.success) {
                alert(result.error || 'Erro ao excluir curso')
            }
        } catch (error) {
            alert('Erro ao excluir curso')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-3 rounded-lg flex items-center gap-2 transition-all active:scale-95 hover:shadow-md"
            style={{ 
                backgroundColor: '#fee2e2', 
                border: '1px solid #fecaca',
                color: '#dc2626'
            }}
            title="Excluir curso"
        >
            {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Trash2 size={16} />
            )}
        </button>
    )
}
