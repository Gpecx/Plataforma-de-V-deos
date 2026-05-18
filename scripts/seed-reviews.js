const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Mock de dados de avaliações (estilo Classroom)
const mockEvaluations = [
  {
    student_id: 'student_alpha',
    rating: 5,
    comment: 'Excelente curso! Explicação extremamente detalhada dos conceitos de proteção e seletividade.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
  },
  {
    student_id: 'student_beta',
    rating: 4,
    comment: 'Muito bom. O material complementar de subestações é fantástico.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
  },
  {
    student_id: 'student_gamma',
    rating: 5,
    comment: 'Didática excelente do professor. Recomendo fortemente a todos na área!',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 dias atrás
  }
];

async function seedEvaluations() {
  try {
    console.log('--- Iniciando Seeding de Avaliações (Classroom Style) ---');
    const coursesSnapshot = await db.collection('courses').get();
    
    if (coursesSnapshot.empty) {
      console.log('Nenhum curso encontrado para associar avaliações.');
      return;
    }

    console.log(`Encontrados ${coursesSnapshot.size} cursos. Populando coleção raiz 'evaluations'...`);

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.title || 'Curso Sem Título';
      const teacherId = courseData.teacher_id || 'teacher_default';
      
      console.log(`\nProcessando curso: "${courseTitle}" (${courseId}) associado ao professor (${teacherId})`);

      // Limpa avaliações antigas deste curso na coleção raiz para evitar duplicações
      const existingEvals = await db.collection('evaluations')
        .where('course_id', '==', courseId)
        .get();

      if (!existingEvals.empty) {
        console.log(`-> Removendo ${existingEvals.size} avaliações existentes para reinicializar...`);
        const batch = db.batch();
        existingEvals.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Adiciona novas avaliações
      const batch = db.batch();
      mockEvaluations.forEach((evalData) => {
        const docId = `${evalData.student_id}_${courseId}`;
        const evalRef = db.collection('evaluations').doc(docId);
        batch.set(evalRef, {
          course_id: courseId,
          teacher_id: teacherId,
          student_id: evalData.student_id,
          rating: evalData.rating,
          comment: evalData.comment,
          created_at: evalData.created_at,
          updated_at: evalData.created_at
        });
        console.log(`   + Adicionando avaliação de rating ${evalData.rating} por ${evalData.student_id}`);
      });

      await batch.commit();
      console.log(`-> 3 avaliações associadas com sucesso na coleção raiz 'evaluations' para o curso "${courseTitle}"!`);
    }

    console.log('\n--- Seeding de Avaliações Finalizado com Sucesso! ---');
  } catch (error) {
    console.error('Erro durante o seeding de avaliações:', error);
  } finally {
    process.exit();
  }
}

seedEvaluations();
