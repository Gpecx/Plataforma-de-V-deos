'use server'

import { getSalesLogs } from '@/app/actions/admin'
import { getSessionUser } from '@/app/actions/auth'

export async function filterSalesAction(professorId: string, startDate?: string, endDate?: string) {
    const session = await getSessionUser()
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' } // B6
    }

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    
    return await getSalesLogs(professorId || undefined, start, end)
}
