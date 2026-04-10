"use client"

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Enrollment {
    id: string
    course_id: string
    user_id: string
    created_at: any
}

interface Course {
    id: string
    title: string
    price: number | string
}

interface Props {
    enrollments: Enrollment[]
    courses: Record<string, Course>
    teacherName: string
}

export function AnalyticsExportButton({ enrollments, courses, teacherName }: Props) {
    const [isLoading, setIsLoading] = useState(false)

    const exportToCSV = async () => {
        setIsLoading(true)
        
        try {
            // Pequeno delay para garantir que o estado de loading seja perceptível se os dados forem poucos
            await new Promise(resolve => setTimeout(resolve, 800))

            // 1. Agrupar dados por dia
            const dailyData: Record<string, { date: string, sales: number, students: number }> = {}

            enrollments.forEach(enrollment => {
                // Formatar data para dia/mês (Padrão BR)
                // Assumindo que created_at pode ser Timestamp do Firebase ou objeto de data
                const dateObj = enrollment.created_at?.toDate ? enrollment.created_at.toDate() : new Date(enrollment.created_at)
                const dateKey = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        date: dateKey,
                        sales: 0,
                        students: 0
                    }
                }

                const price = Number(courses[enrollment.course_id]?.price) || 0
                dailyData[dateKey].sales += price
                dailyData[dateKey].students += 1
            })

            // Converter para array e ordenar por data decrescente
            const sortedData = Object.values(dailyData).sort((a, b) => {
                const [dayA, monthA, yearA] = a.date.split('/').map(Number)
                const [dayB, monthB, yearB] = b.date.split('/').map(Number)
                return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime()
            })

            // 2. Gerar conteúdo CSV
            const headers = "Data;Vendas_Brutas;Novos_Alunos;Visualizacoes;Status_Periodo"
            const rows = sortedData.map(day => {
                const salesStr = day.sales.toFixed(2) // Formato numérico simples para Excel
                return `${day.date};${salesStr};${day.students};0;Processado`
            })

            const csvContent = "\uFEFF" + [headers, ...rows].join("\n")

            // 3. Execução do Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            
            const link = document.createElement("a")
            const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
            const fileName = `analytics-powerplay-${teacherName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.csv`
            
            link.setAttribute("href", url)
            link.setAttribute("download", fileName)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Erro ao exportar CSV:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={isLoading}
            className="border border-black/20 text-slate-600 font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-50 transition-colors bg-white rounded-xl shadow-none"
        >
            {isLoading ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
                <Download size={14} className="mr-2" />
            )}
            {isLoading ? 'Gerando...' : 'Relatório CSV'}
        </Button>
    )
}
