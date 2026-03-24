'use server'

import { adminDb } from '@/lib/firebase-admin'

export async function getFeaturedCourses() {
    try {
        console.log('Fetching featured courses...');
        const snapshot = await adminDb
            .collection('courses')
            .where('status', '==', 'APROVADO')
            .limit(5)
            .get()

        console.log(`Found ${snapshot.size} featured courses.`);
        const courses = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                image_url: data.image_url || null,
                tag: data.tag || 'PREMIUM',
                price: Number(data.price) || 0,
                status: data.status || '',
            }
        })

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

