'use server'

import { getSalesLogs } from '@/app/actions/admin'

export async function filterSalesAction(professorId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    
    return await getSalesLogs(professorId || undefined, start, end)
}
