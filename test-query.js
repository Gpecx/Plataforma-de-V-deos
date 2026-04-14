const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
    })
});

const db = admin.firestore();

async function run() {
    const snap = await db.collection('courses').get();
    console.log(`Total courses: ${snap.size}`);
    snap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${doc.id}: ${data.title} (status: ${data.status}, hasImage: ${!!data.image_url}, hasDesc: ${!!data.description})`);
    });
}

run().catch(console.error);
