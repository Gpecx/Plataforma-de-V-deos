'use server'

import { adminDb } from '@/lib/firebase-admin'

interface SaleData {
    idTransacao?: string
    alunoId: string
    cursoId: string
    valorBruto: number
    taxaPlataforma: number
    repasseProfessor: number
    statusPagamento: 'pago' | 'pendente' | 'cancelado'
    professorId: string
}

/**
 * Registra um log de venda na coleção vendas_logs.
 */
export async function recordSaleAction(data: SaleData) {
    try {
        const saleLog = {
            idTransacao: data.idTransacao || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            alunoId: data.alunoId,
            cursoId: data.cursoId,
            professorId: data.professorId,
            valorBruto: data.valorBruto,
            taxaPlataforma: data.taxaPlataforma,
            repasseProfessor: data.repasseProfessor,
            statusPagamento: data.statusPagamento,
            dataCriacao: new Date()
        }

        const docRef = await adminDb.collection('vendas_logs').add(saleLog)
        return { success: true, id: docRef.id }
    } catch (error) {
        console.error("Erro ao registrar log de venda:", error)
        return { success: false, error: "Falha ao registrar venda." }
    }
}

/**
 * Calcula o split de uma venda baseado na taxa da plataforma.
 */
export async function calculateSplit(price: number, platformTaxPercent: number) {
    const platformShare = price * (platformTaxPercent / 100)
    const teacherShare = price - platformShare
    return {
        platformShare,
        teacherShare
    }
}
