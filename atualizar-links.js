/**
 * atualizar-links.js
 *
 * Script para atualizar as URLs de mídia (imagens e vídeos) no Firestore
 * com os links do Firebase Storage após a migração dos dados do Supabase.
 *
 * Uso: node atualizar-links.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ─── Inicializar Firebase Admin ───────────────────────────────────────────────
const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

const BUCKET_NAME = 'cursos-a5922.firebasestorage.app';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Utilitário: gerar URL pública do Firebase Storage ───────────────────────
function getPublicUrl(filePath) {
    // Codifica o caminho corretamente (ex: "Imagens/foto.png" → "Imagens%2Ffoto.png")
    const encoded = encodeURIComponent(filePath).replace(/%2F/g, '%2F');
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encoded}?alt=media`;
}

// ─── Utilitário: listar arquivos de uma pasta no Storage ─────────────────────
async function listFiles(prefix) {
    const [files] = await bucket.getFiles({ prefix });
    return files
        .map(f => f.name)
        .filter(name => name !== prefix && name !== `${prefix}/`); // remove a "pasta" em si
}

// ─── 1. Atualizar imagens dos cursos ─────────────────────────────────────────
async function atualizarImagensCursos() {
    console.log('\n📚 [COURSES] Atualizando imagens dos cursos...');

    // Buscar todos os arquivos na pasta Imagens/
    const imagens = await listFiles('Imagens/');

    if (imagens.length === 0) {
        console.warn('⚠️  Nenhuma imagem encontrada em Imagens/ no Storage.');
        return;
    }

    console.log(`   Imagens encontradas no Storage (${imagens.length}):`);
    imagens.forEach(img => console.log(`   • ${img}`));

    // Buscar todos os cursos no Firestore
    const coursesSnap = await db.collection('courses').get();

    if (coursesSnap.empty) {
        console.warn('⚠️  Nenhum curso encontrado na coleção courses.');
        return;
    }

    const courses = coursesSnap.docs;
    console.log(`\n   Cursos no Firestore: ${courses.length}`);

    let atualizados = 0;

    for (let i = 0; i < courses.length; i++) {
        const doc = courses[i];
        const data = doc.data();

        // Seleciona a imagem de forma cíclica para garantir que todos os cursos
        // tenham uma imagem atribuída (mesmo que haja mais cursos do que imagens).
        const imagemPath = imagens[i % imagens.length];
        const imagemUrl = getPublicUrl(imagemPath);

        await db.collection('courses').doc(doc.id).update({
            image_url: imagemUrl,
            thumbnail_url: imagemUrl, // atualiza ambos os campos comuns
        });

        console.log(`   ✅ Curso "${data.title || doc.id}" → ${path.basename(imagemPath)}`);
        atualizados++;
    }

    console.log(`\n   Total de cursos atualizados: ${atualizados}`);
}

// ─── 2. Atualizar vídeos das lições ──────────────────────────────────────────
async function atualizarVideosLicoes() {
    console.log('\n🎬 [LESSONS] Atualizando vídeos das lições...');

    // URLs dos vídeos no Storage
    const videoIntroUrl = getPublicUrl('Videos/Intro.mp4');
    const videoAula1Url = getPublicUrl('Videos/aula-1.mp4');

    console.log(`   URL Intro   : ${videoIntroUrl}`);
    console.log(`   URL Aula 1  : ${videoAula1Url}`);

    // Buscar todas as lições
    const lessonsSnap = await db.collection('lessons').get();

    if (lessonsSnap.empty) {
        console.warn('⚠️  Nenhuma lição encontrada na coleção lessons.');
        return;
    }

    // Ordenar as lições por position/order para garantir que a primeira lição
    // (boas-vindas/intro) receba o vídeo correto.
    const lessons = lessonsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            // Ordena por position, order, ou created_at — o que existir
            const posA = a.position ?? a.order ?? 0;
            const posB = b.position ?? b.order ?? 0;
            return posA - posB;
        });

    console.log(`\n   Lições encontradas: ${lessons.length}`);

    let atualizadas = 0;

    for (const lesson of lessons) {
        const titulo = (lesson.title || '').toLowerCase();
        const posicao = lesson.position ?? lesson.order ?? 999;

        let videoUrl;
        let motivo;

        // Critérios para identificar a lição de boas-vindas / intro:
        // • título contém "intro", "boas-vindas", "bem-vindo", "welcome"
        // • OU é a primeira lição (posição 0 ou 1)
        const ehIntro =
            titulo.includes('intro') ||
            titulo.includes('boas-vindas') ||
            titulo.includes('bem-vindo') ||
            titulo.includes('welcome') ||
            posicao === 0 ||
            posicao === 1;

        if (ehIntro) {
            videoUrl = videoIntroUrl;
            motivo = 'Intro (boas-vindas)';
        } else {
            videoUrl = videoAula1Url;
            motivo = 'Aula 1';
        }

        await db.collection('lessons').doc(lesson.id).update({
            video_url: videoUrl,
            mux_playback_id: null, // limpa o ID do Mux se existir
        });

        console.log(
            `   ✅ Lição "${lesson.title || lesson.id}" [pos:${posicao}] → ${motivo}`
        );
        atualizadas++;
    }

    console.log(`\n   Total de lições atualizadas: ${atualizadas}`);
}

// ─── 3. Relatório final ───────────────────────────────────────────────────────
async function imprimirResumo() {
    console.log('\n📊 [RESUMO] Verificando dados atualizados...\n');

    const cursosSnap = await db.collection('courses').limit(3).get();
    console.log('Primeiros cursos (até 3):');
    cursosSnap.forEach(doc => {
        const d = doc.data();
        console.log(`  • ${d.title || doc.id}`);
        console.log(`    image_url: ${d.image_url || '❌ vazio'}`);
    });

    const licoesSnap = await db.collection('lessons').orderBy('position').limit(5).get();
    console.log('\nPrimeiras lições (até 5, ordenadas por position):');
    licoesSnap.forEach(doc => {
        const d = doc.data();
        console.log(`  • [pos:${d.position ?? d.order ?? '?'}] ${d.title || doc.id}`);
        console.log(`    video_url: ${d.video_url ? '✅ ' + d.video_url.substring(0, 80) + '...' : '❌ vazio'}`);
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 Iniciando atualização de links de mídia no Firestore...');
    console.log(`   Bucket: ${BUCKET_NAME}\n`);

    try {
        await atualizarImagensCursos();
        await atualizarVideosLicoes();
        await imprimirResumo();

        console.log('\n✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!\n');
    } catch (err) {
        console.error('\n❌ Erro durante a atualização:', err);
    } finally {
        process.exit(0);
    }
}

main();
