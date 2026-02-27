const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
    process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Inicializar Firebase
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateTable(tableName) {
    console.log(`--- Migrando tabela: ${tableName} ---`);

    // Buscar todos os dados da tabela no Supabase
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
        console.error(`Erro ao buscar dados da tabela ${tableName}:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`Tabela ${tableName} está vazia.`);
        return;
    }

    console.log(`Encontrados ${data.length} registros em ${tableName}.`);

    const colRef = db.collection(tableName);
    let count = 0;

    for (const item of data) {
        // Usar o ID do Supabase como ID do documento no Firestore
        await colRef.doc(item.id).set(item);
        count++;
        if (count % 10 === 0) {
            console.log(`Progresso em ${tableName}: ${count}/${data.length}`);
        }
    }

    console.log(`Sucesso! ${count} registros migrados para a coleção ${tableName}.`);
}

async function runMigration() {
    try {
        const tables = ['profiles', 'courses', 'lessons', 'enrollments'];

        for (const table of tables) {
            await migrateTable(table);
        }

        console.log('\n--- MIGRAÇÃO CONCLUÍDA COM SUCESSO ---');
    } catch (err) {
        console.error('Erro fatal durante a migração:', err);
    } finally {
        process.exit(0);
    }
}

runMigration();
