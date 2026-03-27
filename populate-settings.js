const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const settings = {
  banners: {
    hero_home: [
      {
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop',
        order: 1
      }
    ],
    hero_dashboard: [
      {
        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop',
        order: 1
      }
    ],
    hero_course: [
      {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
        order: 1
      }
    ]
  },
  branding: {
    logoUrl: 'https://firebasestorage.googleapis.com/v0/b/danielsiqueira2027-cloud.firebasestorage.app/o/course_images%2FSPCSacademy2.png?alt=media',
    siteName: 'PowerPlay',
    primaryColor: '#1D5F31'
  }
};

async function populateSettings() {
  try {
    await db.collection('settings').doc('global').set(settings, { merge: true });
    console.log('Global settings populated successfully!');
  } catch (error) {
    console.error('Error populating settings:', error);
  } finally {
    process.exit();
  }
}

populateSettings();
