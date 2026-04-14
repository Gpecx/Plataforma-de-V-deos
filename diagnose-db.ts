
import { adminDb } from './src/lib/firebase-admin';

async function diagnose() {
    try {
        console.log('--- DIAGNOSTIC START ---');
        const snapshot = await adminDb.collection('courses').get();
        console.log(`Total courses in DB: ${snapshot.size}`);
        
        const statuses = new Map();
        snapshot.docs.forEach(doc => {
            const status = doc.data().status;
            statuses.set(status, (statuses.get(status) || 0) + 1);
        });
        
        console.log('Statuses found:', Object.fromEntries(statuses));
        
        const publishedIn = await adminDb.collection('courses')
            .where('status', 'in', ['published', 'APROVADO'])
            .get();
        console.log(`Query "status in [published, APROVADO]" size: ${publishedIn.size}`);
        
        const publishedEq = await adminDb.collection('courses')
            .where('status', '==', 'published')
            .get();
        console.log(`Query "status == published" size: ${publishedEq.size}`);

        const aprovadoEq = await adminDb.collection('courses')
            .where('status', '==', 'APROVADO')
            .get();
        console.log(`Query "status == APROVADO" size: ${aprovadoEq.size}`);
        
        console.log('--- DIAGNOSTIC END ---');
    } catch (error) {
        console.error('DIAGNOSTIC ERROR:', error);
    }
}

diagnose();
