'use server'

import { adminDb } from '@/lib/firebase-admin'
import { serializeFirestoreData } from '@/lib/date-utils'

function formatCourseDoc(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
    const data = doc.data()!
    return serializeFirestoreData({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        image_url: data.image_url || null,
        tag: data.tag || '',
        pricing_type: data.pricing_type || 'standard',
        price: Number(data.price) || 0,
        status: data.status || '',
        teacher_id: data.teacher_id || null,
        teacher_name: data.teacher_name || null,
        created_at: data.created_at || null,
    })
}

async function fallbackFeaturedCourses() {
    const snapshot = await adminDb
        .collection('courses')
        .where('status', '==', 'APROVADO')
        .limit(5)
        .get()
    return snapshot.docs.map(formatCourseDoc)
}

export async function getFeaturedCourses() {
    try {
        const settingsDoc = await adminDb.collection('settings').doc('global').get()
        const settings = settingsDoc.data()
        const featuredIds: string[] = settings?.featuredCourseIds || []

        if (featuredIds.length === 0) {
            return fallbackFeaturedCourses()
        }

        const courses: any[] = []
        for (const id of featuredIds) {
            const doc = await adminDb.collection('courses').doc(id).get()
            if (doc.exists) {
                const data = doc.data()!
                if (data.status === 'APROVADO') {
                    courses.push(formatCourseDoc(doc))
                }
            }
        }

        if (courses.length === 0) {
            return fallbackFeaturedCourses()
        }

        return courses
    } catch (error) {
        console.error('Erro ao buscar cursos em destaque:', error)
        return [{
            id: 'erro-123',
            title: String(error),
            description: 'Erro no servidor',
            image_url: null,
            tag: 'ERROR',
            price: 0,
            status: 'ERROR'
        }]
    }
}
