import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendNewChatMessageEmail, sendChatReplyEmail } from '@/lib/mail'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, teacherId, studentId, courseName, messageContent } = body

        if (!teacherId || !studentId || !messageContent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const [teacherProfile, studentProfile] = await Promise.all([
            adminDb.collection('profiles').doc(teacherId).get(),
            adminDb.collection('profiles').doc(studentId).get(),
        ])

        const teacherData = teacherProfile.data()
        const studentData = studentProfile.data()

        if (!teacherData?.email || !studentData?.email) {
            console.warn('[notify/chat] Perfil sem e-mail:', { teacherId, studentId })
            return NextResponse.json({ success: false, message: 'Perfil sem e-mail' }, { status: 200 })
        }

        const teacherName = teacherData.full_name || teacherData.name || teacherData.displayName || 'Professor'
        const studentName = studentData.full_name || studentData.name || studentData.displayName || 'Aluno'
        const courseDisplay = courseName || 'Treinamento'

        if (type === 'student') {
            // Aluno enviou → notifica professor
            await sendNewChatMessageEmail({
                teacherEmail: teacherData.email,
                teacherName,
                studentName,
                courseName: courseDisplay,
                messagePreview: messageContent,
            })
        } else if (type === 'teacher') {
            // Professor respondeu → notifica aluno
            await sendChatReplyEmail({
                studentEmail: studentData.email,
                studentName,
                teacherName,
                courseName: courseDisplay,
                messagePreview: messageContent,
            })
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('[notify/chat] Erro:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
