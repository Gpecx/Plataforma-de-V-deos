import { adminDb } from "@/lib/firebase-admin";
import { parseFirebaseDate } from "@/lib/date-utils";
import CoursesClient from "./CoursesClient";
import { getBanners } from "@/app/admin/settings/actions";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoursesPage() {
    let courses: any[] = [];
    let teachers: any[] = [];
    let heroBanners: string[] = [];
    let vitrineCategorias: string[] = []; // NOVO
    let vitrineCursosFixados: Record<string, string[]> = {}; // NOVO

    try {
        const [snapshot, teachersSnapshot, banners, vitrineSnap] = await Promise.all([
            adminDb.collection('courses').where('status', '==', 'APROVADO').get(),
            adminDb.collection('profiles').where('role', '==', 'teacher').get(),
            getBanners(),
            adminDb.collection('settings').doc('vitrine').get() // NOVO
        ]);

        // NOVO: Load vitrine categories
        const vitrineData = vitrineSnap.data() || {};
        vitrineCategorias = vitrineSnap.exists ? (vitrineData.categorias || []) : [];
        vitrineCursosFixados = vitrineSnap.exists ? (vitrineData.cursosFixados || {}) : {}; // NOVO

        heroBanners = banners.hero_course
            .sort((a, b) => a.order - b.order)
            .map(b => b.url)
            .filter(url => !!url);

        courses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
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
                created_at: parseFirebaseDate(data.created_at)?.toISOString() || null,
            };
        });

        teachers = teachersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                full_name: data.full_name || '',
                photoURL: data.photoURL || data.avatar_url || data.image_url || null,
                specialty: data.specialty || 'Especialista PowerPlay',
            };
        });
    } catch (error) {
        console.error("Erro ao buscar cursos no servidor:", error);
    }

    return <CoursesClient initialCourses={courses} initialTeachers={teachers} heroBanners={heroBanners} vitrineCategorias={vitrineCategorias} vitrineCursosFixados={vitrineCursosFixados} />;
}
