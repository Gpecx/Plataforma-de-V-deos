import { adminDb } from "@/lib/firebase-admin";
import { parseFirebaseDate } from "@/lib/date-utils";
import CoursesClient from "./CoursesClient";
import { getBanners } from "@/app/admin/settings/actions";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoursesPage() {
    let courses: any[] = [];
    let heroBanners: string[] = [];

    try {
        const [snapshot, banners] = await Promise.all([
            adminDb.collection('courses').where('status', '==', 'published').get(),
            getBanners()
        ]);

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
                tag: data.tag || 'TREINAMENTO',
                image_url: data.image_url || null,
                duration: data.duration || 0,
                status: data.status || 'published',
                teacher_id: data.teacher_id || null,
                teacher_name: data.teacher_name || 'Equipe SPCS',
                created_at: parseFirebaseDate(data.created_at)?.toISOString() || null,
            };
        });
    } catch (error) {
        console.error("Erro ao buscar cursos no servidor:", error);
    }

    return <CoursesClient initialCourses={courses} heroBanners={heroBanners} />;
}
