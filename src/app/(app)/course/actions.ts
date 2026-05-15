'use server'

import { adminDb } from '@/lib/firebase-admin'
import { serializeFirestoreData } from '@/lib/date-utils'

export async function getCoursesByCategory(category: string, limitCount: number = 8, lastVisibleId?: string) {
    try {
        let query = adminDb.collection('courses')
            .where('status', '==', 'APROVADO')
            .where('category', '==', category)
            .orderBy('created_at', 'desc');

        if (lastVisibleId) {
            const lastDoc = await adminDb.collection('courses').doc(lastVisibleId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        const snapshot = await query.limit(limitCount).get();

        const courses = snapshot.docs.map(doc => {
            const data = doc.data();
            return serializeFirestoreData({
                id: doc.id,
                title: data.title || '',
                subtitle: data.subtitle || '',
                description: data.description || '',
                category: data.category || 'Lançamentos',
                price: data.price ?? 157,
                tag: data.tag || '',
                image_url: data.image_url || null,
                duration: data.duration || 0,
                status: data.status || 'APROVADO',
                teacher_id: data.teacher_id || null,
                teacher_name: data.teacher_name || 'Equipe PowerPlay',
                tags: data.tags || [],
                pricing_type: data.pricing_type || 'standard',
                created_at: data.created_at || null,
            });
        });

        return {
            courses,
            lastVisibleId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
            hasMore: snapshot.docs.length === limitCount
        };
    } catch (error) {
        console.error(`Erro ao buscar cursos da categoria ${category}:`, error);
        return { courses: [], lastVisibleId: null, hasMore: false };
    }
}
