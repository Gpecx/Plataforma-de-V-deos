import { auth, db } from '@/lib/firebase'
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore'

/**
 * Action para criar um novo curso
 */
export async function createCourseAction(formData: any) {
    const user = auth.currentUser
    if (!user) return { error: "Não autorizado" }

    try {
        // 1. Insere o curso
        const docRef = await addDoc(collection(db, 'courses'), {
            teacher_id: user.uid,
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description,
            category: formData.category,
            price: formData.price || 157.0,
            status: 'published',
            image_url: formData.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070",
            created_at: new Date().toISOString()
        });

        const courseId = docRef.id;

        // 2. Insere as aulas vinculadas a este curso
        if (formData.lessons && formData.lessons.length > 0) {
            const batch = writeBatch(db);
            formData.lessons.forEach((lesson: any, index: number) => {
                const lessonRef = doc(collection(db, 'lessons'));
                batch.set(lessonRef, {
                    course_id: courseId,
                    title: lesson.title,
                    video_url: lesson.video_url,
                    position: index + 1,
                    created_at: new Date().toISOString()
                });
            });
            await batch.commit();
        }

        return { success: true, courseId: courseId }
    } catch (error: any) {
        console.error('Erro ao criar curso:', error);
        return { error: error.message }
    }
}

/**
 * Action para excluir um curso existente
 */
export async function deleteCourseAction(courseId: string) {
    const user = auth.currentUser
    if (!user) return { error: "Não autorizado" }

    try {
        // 1. Excluir o curso
        await deleteDoc(doc(db, 'courses', courseId));

        // 2. Excluir as aulas associadas
        const q = query(collection(db, 'lessons'), where('course_id', '==', courseId));
        const lessonsSnap = await getDocs(q);
        const batch = writeBatch(db);
        lessonsSnap.docs.forEach(lessonDoc => {
            batch.delete(lessonDoc.ref);
        });
        await batch.commit();

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao excluir curso:', error);
        return { error: error.message }
    }
}

/**
 * Action para atualizar um curso e suas aulas
 */
export async function updateCourseAction(courseId: string, formData: any) {
    const user = auth.currentUser
    if (!user) return { error: "Não autorizado" }

    try {
        // 2. Atualiza os dados básicos do curso
        const updateData: any = {}
        if (formData.title !== undefined) updateData.title = formData.title
        if (formData.price !== undefined && !isNaN(formData.price)) updateData.price = formData.price
        if (formData.status !== undefined) updateData.status = formData.status
        if (formData.image_url !== undefined) updateData.image_url = formData.image_url
        updateData.updated_at = new Date().toISOString();

        await updateDoc(doc(db, 'courses', courseId), updateData);

        // 3. Gerencia as aulas
        const lessons = formData.lessons || []

        // Pega as IDs atuais no banco para saber o que deletar
        const q = query(collection(db, 'lessons'), where('course_id', '==', courseId));
        const existingLessonsSnap = await getDocs(q);
        const existingLessons = existingLessonsSnap.docs.map(doc => ({ id: doc.id, ref: doc.ref }));

        const incomingIds = lessons.map((l: any) => l.id).filter((id: any) => id && !String(id).startsWith('new-'))
        const lessonsToDelete = existingLessons.filter(l => !incomingIds.includes(l.id))

        const batch = writeBatch(db);

        // Deleção
        lessonsToDelete.forEach(l => {
            batch.delete(l.ref);
        });

        // Upsert
        lessons.forEach((lesson: any, index: number) => {
            const lessonData = {
                course_id: courseId,
                title: lesson.title,
                video_url: lesson.video_url,
                position: index + 1,
                updated_at: new Date().toISOString()
            };

            if (lesson.id && !String(lesson.id).startsWith('new-')) {
                batch.update(doc(db, 'lessons', lesson.id), lessonData);
            } else {
                const newLessonRef = doc(collection(db, 'lessons'));
                batch.set(newLessonRef, {
                    ...lessonData,
                    created_at: new Date().toISOString()
                });
            }
        });

        await batch.commit();

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar curso:', error);
        return { error: error.message }
    }
}