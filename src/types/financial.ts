export interface Payment {
    id: string
    courseName: string
    teacherName: string
    teacherId: string | null
    grossValue: number
    platformShare: number
    teacherShare: number
    date: string | null
    commissionStatus?: 'pending' | 'paid'
}
