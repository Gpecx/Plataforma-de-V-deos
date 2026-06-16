import { db, auth } from './firebase'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    deleteDoc,
    writeBatch
} from 'firebase/firestore'

const PROFANITY_LIST: RegExp[] = [
    /\bputa\b/i, /\bmerda\b/i, /\bidiota\b/i, /\bestupido\b/i, /\bestúpido\b/i,
    /\bbosta\b/i, /\bviadinho\b/i, /\bbabaca\b/i, /\bburro\b/i, /\bcretino\b/i,
    /\bimbeciil\b/i, /\bimbecil\b/i, /\botário\b/i, /\botario\b/i, /\bvagabundo\b/i,
    /\bcanalha\b/i, /\bdesgraça\b/i, /\bdesgraca\b/i, /\bfilho\s*da\s*puta\b/i,
    /\bviado\b/i, /\bporra\b/i, /\bcorno\b/i, /\bpilantra\b/i, /\btrouxa\b/i,
    /f[\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?d[\s\*\.\-\_\@\#\$]?[aá4eê3]/i,
    /v[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?s[\s\*\.\-\_\@\#\$]?[eê3][\s\*\.\-\_\@\#\$]?f[\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?d[\s\*\.\-\_\@\#\$]?[eê3]/i,
    /\bvsf\b/i, /\bvtnc\b/i,
    /v[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?d[\s\*\.\-\_\@\#\$]?[o0]/i,
    /\bg[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?y\b/i,
    /b[\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?l[\s\*\.\-\_\@\#\$]?[aá4]/i,
    /b[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?[cç][\s\*\.\-\_\@\#\$]?[h]?[aá4]/i,
    /fr[\s\*\.\-\_\@\#\$]?[eê3][\s\*\.\-\_\@\#\$]?s[\s\*\.\-\_\@\#\$]?c[\s\*\.\-\_\@\#\$]?r[\s\*\.\-\_\@\#\$]?[o0]/i,
    /\bs[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?p[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[aã][o0]/i,
    /\bbait[\s\*\.\-\_\@\#\$]?[o0]\b/i,
    /\bmaric[\s\*\.\-\_\@\#\$]?[aá4]s\b/i,
    /\bmariquinh[\s\*\.\-\_\@\#\$]?[aá4]/i,
    /\bf[\s\*\.\-\_]?d[\s\*\.\-\_]?p\b/i,
    /[aá4][\s\*\.\-\_\@\#\$]?r+[\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?m[\s\*\.\-\_\@\#\$]?b[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?d[\s\*\.\-\_\@\#\$]?[o0]/i,
    /\bc+u+\b/i,
    /c[\s\*\.\-\_\@\#\$]?u[\s\*\.\-\_\@\#\$]?z[\s\*\.\-\_\@\#\$]?[aã][o0]/i,
    /b[\s\*\.\-\_\@\#\$]?u[\s\*\.\-\_\@\#\$]?c[\s\*\.\-\_\@\#\$]?[eê3][\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[aá4]/i,
    /p[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?r[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?n[\s\*\.\-\_\@\#\$]?h[\s\*\.\-\_\@\#\$]?[aá4]/i,
    /pr[\s\*\.\-\_\@\#\$]?[o0][\s\*\.\-\_\@\#\$]?s[\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?u[\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[aá4]/i,
    /\bp[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?n[\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[o0]\b/i,
    /c[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?c[\s\*\.\-\_\@\#\$]?[eê3][\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[eê3]/i,
    /d[\s\*\.\-\_\@\#\$]?[eê3][\s\*\.\-\_\@\#\$]?s[\s\*\.\-\_\@\#\$]?gr[\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?[cç][\s\*\.\-\_\@\#\$]?[aá4][\s\*\.\-\_\@\#\$]?d[\s\*\.\-\_\@\#\$]?[o0]/i,
    /\bvoc[êe]\s+[eéê]\s+um\s+lixo\b/i,
    /\bsua\s+lixo\b/i,
    /[i1][\s\*\.\-\_\@\#\$]?n[\s\*\.\-\_\@\#\$]?[uú][\s\*\.\-\_\@\#\$]?t[\s\*\.\-\_\@\#\$]?[i1][\s\*\.\-\_\@\#\$]?l/i,
    /\bseu\s+(arrombado|idiota|burro|imbecil|inútil|lixo|cretino|ot[aá]rio|babaca|vagabundo)\b/i,
    /\bsua\s+(vaca|piranha|prostituta|vagabunda|burra|idiota)\b/i,
    /\bfuck\b/i, /\bshit\b/i, /\basshole\b/i, /\bbitch\b/i, /\bstupid\b/i,
    /\bidiot\b/i, /\bmoron\b/i, /\bdumbass\b/i, /\bprick\b/i, /\bdick\b/i,
    /\bcunt\b/i, /\bdamn\b/i, /\bbastard\b/i, /\bcrazy\b/i, /\bwanker\b/i,
    /\bpendejo\b/i, /\bcabron\b/i, /\bmaricón\b/i, /\bmaricon\b/i, /\bpinche\b/i,
    /\bchingado\b/i, /\bchinga\b/i, /\bhijodeputa\b/i, /\bcoño\b/i, /\bconyo\b/i,
    /\bmaldito\b/i, /\bimbécil\b/i,
]

function containsProfanity(text: string): boolean {
    return PROFANITY_LIST.some((regex) => regex.test(text))
}

interface Reply {
    id: string
    teacherId: string
    teacherName: string
    content: string
    createdAt: Timestamp
}

interface Comment {
    id: string
    lessonId: string
    courseId: string
    studentId: string
    studentName: string
    studentAvatar: string | null
    content: string
    status: 'pending' | 'answered'
    createdAt: Timestamp
    updatedAt: Timestamp
    replies: Reply[]
}

export async function createComment(lessonId: string, courseId: string, content: string): Promise<string> {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    if (containsProfanity(content)) {
        throw new Error('Seu comentário contém linguagem inapropriada. Por favor, revise o texto.')
    }

    const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
    const profileData = profileDoc.data()
    const studentName = profileData?.full_name || profileData?.name || profileData?.displayName || 'Aluno'
    const studentAvatar = profileData?.photoURL || null

    const docRef = await addDoc(collection(db, 'lesson_comments'), {
        lessonId,
        courseId,
        studentId: user.uid,
        studentName,
        studentAvatar,
        content,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    return docRef.id
}

export async function getCommentsByLesson(lessonId: string, courseId: string): Promise<Comment[]> {
    const q = query(
        collection(db, 'lesson_comments'),
        where('lessonId', '==', lessonId),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    const comments: Comment[] = []

    for (const commentDoc of snapshot.docs) {
        const commentData = commentDoc.data() as Omit<Comment, 'id' | 'replies'>
        const repliesQuery = query(
            collection(db, 'lesson_comments', commentDoc.id, 'replies'),
            orderBy('createdAt', 'asc')
        )
        const repliesSnapshot = await getDocs(repliesQuery)
        const replies: Reply[] = repliesSnapshot.docs.map((replyDoc) => {
            const replyData = replyDoc.data() as Omit<Reply, 'id'>
            return { id: replyDoc.id, ...replyData }
        })

        comments.push({
            id: commentDoc.id,
            ...commentData,
            replies,
        })
    }

    return comments
}

export interface TeacherComment extends Comment {
    lessonTitle: string
}

export async function getCommentsByTeacher(teacherUid: string): Promise<TeacherComment[]> {
    const coursesSnapshot = await getDocs(
        query(
            collection(db, 'courses'),
            where('teacher_id', '==', teacherUid)
        )
    )

    const courseIds = coursesSnapshot.docs.map((d) => d.id)
    if (courseIds.length === 0) return []

    const [commentsSnapshot, lessonsSnapshot] = await Promise.all([
        getDocs(
            query(
                collection(db, 'lesson_comments'),
                where('courseId', 'in', courseIds),
                orderBy('createdAt', 'desc')
            )
        ),
        getDocs(
            query(
                collection(db, 'lessons'),
                where('course_id', 'in', courseIds)
            )
        ),
    ])

    const lessonTitleMap = new Map<string, string>()
    lessonsSnapshot.docs.forEach((d) => {
        const data = d.data()
        lessonTitleMap.set(d.id, data.title || data.name || '')
    })

    const comments: TeacherComment[] = []

    for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data() as Omit<Comment, 'id' | 'replies'>
        const repliesQuery = query(
            collection(db, 'lesson_comments', commentDoc.id, 'replies'),
            orderBy('createdAt', 'asc')
        )
        const repliesSnapshot = await getDocs(repliesQuery)
        const replies: Reply[] = repliesSnapshot.docs.map((replyDoc) => {
            const replyData = replyDoc.data() as Omit<Reply, 'id'>
            return { id: replyDoc.id, ...replyData }
        })

        comments.push({
            id: commentDoc.id,
            ...commentData,
            replies,
            lessonTitle: lessonTitleMap.get(commentData.lessonId) || 'Aula',
        })
    }

    return comments
}

export async function replyToComment(commentId: string, content: string): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
    const profileData = profileDoc.data()
    const teacherName = profileData?.full_name || profileData?.name || profileData?.displayName || 'Professor'

    await addDoc(
        collection(db, 'lesson_comments', commentId, 'replies'),
        {
            teacherId: user.uid,
            teacherName,
            content,
            createdAt: serverTimestamp(),
        }
    )

    await updateDoc(doc(db, 'lesson_comments', commentId), {
        status: 'answered',
        updatedAt: serverTimestamp(),
    })
}

export async function deleteComment(commentId: string): Promise<void> {
    const commentRef = doc(db, 'lesson_comments', commentId)
    const repliesSnapshot = await getDocs(collection(db, 'lesson_comments', commentId, 'replies'))
    const batch = writeBatch(db)
    repliesSnapshot.docs.forEach((replyDoc) => batch.delete(replyDoc.ref))
    batch.delete(commentRef)
    await batch.commit()
}
