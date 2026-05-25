'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCourse } from '@/app/actions/admin'
import { toast } from 'sonner'

interface CourseDeleteButtonProps {
    courseId: string
    courseTitle: string
}

export default function CourseDeleteButton({ courseId, courseTitle }: CourseDeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteClick = () => {
        toast(`Deseja excluir o curso "${courseTitle}"?`, {
            description: "ESTA AÇÃO É IRREVERSÍVEL E TODAS AS AULAS SERÃO REMOVIDAS.",
            action: {
                label: "Confirmar",
                onClick: async () => {
                    setIsDeleting(true)
                    try {
                        const result = await deleteCourse(courseId)
                        if (result.success) {
                            toast.success("Curso excluído com sucesso!")
                        } else {
                            toast.error(result.error || 'Erro ao excluir curso')
                        }
                    } catch (error) {
                        toast.error('Erro ao excluir curso')
                    } finally {
                        setIsDeleting(false)
                    }
                }
            },
            cancel: {
                label: "Cancelar",
                onClick: () => {}
            }
        })
    }

    return (
        <button
            onClick={handleDeleteClick}
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

