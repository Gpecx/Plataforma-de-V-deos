const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.log('No service account key found');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function test() {
  const snapshot = await db.collection('courses').where('status', 'in', ['published', 'APROVADO']).limit(5).get();
  console.log(`Found ${snapshot.size} courses`);
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data().status, doc.data().title);
  });
}

test().catch(console.error);
