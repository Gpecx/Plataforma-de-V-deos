
const { adminDb } = require('./src/lib/firebase-admin');

async function checkSchema() {
    try {
        const lessonsSnap = await adminDb.collection('lessons').limit(5).get();
        lessonsSnap.docs.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
