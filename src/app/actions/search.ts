'use server'

import { adminDb } from '@/lib/firebase-admin'

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    image?: string | null;
    type: 'course' | 'teacher';
    slug?: string;
}

export async function searchGlobal(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const normalizedQuery = query.trim();
        const capitalizedQuery = normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1).toLowerCase();
        const upperQuery = normalizedQuery.toUpperCase();
        const lowerQuery = normalizedQuery.toLowerCase();

        // Buscas paralelas tentando variações comuns (Original, Capitalizada, Tudo Maiúsculo)
        // Nota: Firestore é case-sensitive, então tentamos as 3 formas mais prováveis
        const [coursesSnap, teachersSnap] = await Promise.all([
            adminDb.collection('courses')
                .where('status', '==', 'APROVADO')
                .orderBy('title')
                .startAt(normalizedQuery)
                .endAt(normalizedQuery + '\uf8ff')
                .limit(5)
                .get(),
            adminDb.collection('profiles')
                .orderBy('full_name')
                .startAt(normalizedQuery)
                .endAt(normalizedQuery + '\uf8ff')
                .limit(20)
                .get()
        ]);

        let results: SearchResult[] = [];

        const addResults = (snap: any, type: 'course' | 'teacher') => {
            snap.docs.forEach((doc: any) => {
                const data = doc.data();
                
                // Apenas professores (admins são invisíveis na busca)
                if (type === 'teacher' && data.role !== 'teacher') return;

                if (!results.find(r => r.id === doc.id)) {
                    results.push({
                        id: doc.id,
                        title: type === 'course' ? data.title : data.full_name,
                        subtitle: type === 'course' ? data.category : (data.specialty || 'Instrutor'),
                        image: type === 'course' ? data.image_url : (data.photoURL || data.avatar_url || data.image_url),
                        type,
                        slug: data.slug || doc.id
                    });
                }
            });
        };

        addResults(coursesSnap, 'course');
        addResults(teachersSnap, 'teacher');

        // Se não veio nada, tentamos com a primeira letra maiúscula
        if (results.length === 0 && normalizedQuery !== capitalizedQuery) {
            const [cSnap2, tSnap2] = await Promise.all([
                adminDb.collection('courses')
                    .where('status', '==', 'APROVADO')
                    .orderBy('title')
                    .startAt(capitalizedQuery)
                    .endAt(capitalizedQuery + '\uf8ff')
                    .limit(5)
                    .get(),
                adminDb.collection('profiles')
                    .orderBy('full_name')
                    .startAt(capitalizedQuery)
                    .endAt(capitalizedQuery + '\uf8ff')
                    .limit(10)
                    .get()
            ]);
            addResults(cSnap2, 'course');
            addResults(tSnap2, 'teacher');
        }

        // Se ainda não veio nada, tentamos tudo maiúsculo
        if (results.length === 0 && normalizedQuery !== upperQuery) {
            const [cSnap3, tSnap3] = await Promise.all([
                adminDb.collection('courses')
                    .where('status', '==', 'APROVADO')
                    .orderBy('title')
                    .startAt(upperQuery)
                    .endAt(upperQuery + '\uf8ff')
                    .limit(5)
                    .get(),
                adminDb.collection('profiles')
                    .orderBy('full_name')
                    .startAt(upperQuery)
                    .endAt(upperQuery + '\uf8ff')
                    .limit(10)
                    .get()
            ]);
            addResults(cSnap3, 'course');
            addResults(tSnap3, 'teacher');
        }

        // BUG-03 fix: 4ª tentativa com tudo minúsculo (cobre dados salvos em lowercase)
        if (results.length === 0 && normalizedQuery !== lowerQuery) {
            const [cSnap4, tSnap4] = await Promise.all([
                adminDb.collection('courses')
                    .where('status', '==', 'APROVADO')
                    .orderBy('title')
                    .startAt(lowerQuery)
                    .endAt(lowerQuery + '\uf8ff')
                    .limit(5)
                    .get(),
                adminDb.collection('profiles')
                    .orderBy('full_name')
                    .startAt(lowerQuery)
                    .endAt(lowerQuery + '\uf8ff')
                    .limit(10)
                    .get()
            ]);
            addResults(cSnap4, 'course');
            addResults(tSnap4, 'teacher');
        }

        return results.slice(0, 10);
    } catch (error) {
        console.error('Erro na busca global:', error);
        return [];
    }
}
