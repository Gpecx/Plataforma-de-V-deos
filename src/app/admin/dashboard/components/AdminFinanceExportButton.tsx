"use client"

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Payment {
    id: string
    courseName: string
    teacherName: string
    grossValue: number
    platformShare: number
    teacherShare: number
    date: string
}

interface Props {
    payments: Payment[]
}

export function AdminFinanceExportButton({ payments }: Props) {
    const [isLoading, setIsLoading] = useState(false)

    const exportToCSV = async () => {
        setIsLoading(true)
        
        try {
            // Delay simulado para UX
            await new Promise(resolve => setTimeout(resolve, 600))

            // 1. Preparar Cabeçalhos e Conteúdo
            const headers = "Data;Curso;Professor;Valor_Bruto;Lucro_Plataforma;Repasse_Professor;Status"
            
            const rows = payments.map(p => {
                // Formatar data localmente se possível, caso venha como ISO string
                const dateObj = new Date(p.date)
                const formattedDate = !isNaN(dateObj.getTime()) 
                    ? dateObj.toLocaleDateString('pt-BR') 
                    : 'N/A'

                // Formatação numérica simples (sem R$)
                const gross = p.grossValue.toFixed(2)
                const platform = p.platformShare.toFixed(2)
                const teacher = p.teacherShare.toFixed(2)
                
                return `${formattedDate};${p.courseName};${p.teacherName};${gross};${platform};${teacher};Sucedido`
            })

            // 2. Criar String CSV com BOM para Excel BR
            const csvContent = "\uFEFF" + [headers, ...rows].join("\n")

            // 3. Download via Blob
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            
            const link = document.createElement("a")
            const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
            const fileName = `fechamento-global-powerplay-${today}.csv`
            
            link.setAttribute("href", url)
            link.setAttribute("download", fileName)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Erro ao exportar fechamento global:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            onClick={exportToCSV}
            disabled={isLoading}
            className="rounded-xl bg-[#1D5F31] hover:bg-[#1D5F31]/90 text-white font-bold uppercase text-[10px] tracking-[2px] px-6 py-2 h-auto border-none transition-all flex items-center gap-2 shadow-none"
        >
            {isLoading ? (
                <Loader2 size={12} className="animate-spin" />
            ) : (
                <Download size={12} />
            )}
            {isLoading ? 'Gerando...' : 'Relatório CSV'}
        </Button>
    )
}
