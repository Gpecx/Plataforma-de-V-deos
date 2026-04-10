const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        // Try to use the same logic as the app
        admin.initializeApp({
            credential: admin.credential.cert(require('../serviceAccountKey.json')),
            storageBucket: 'cursos-a5922.firebasestorage.app'
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        process.exit(1);
    }
}

const db = admin.firestore();
const auth = admin.auth();

async function syncAdminRoles() {
    console.log('Starting sync of Admin roles...');
    
    // 1. List all users (handling pagination if necessary, but assuming small number for now)
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;
    
    let updatedCount = 0;
    
    for (const user of users) {
        const claims = user.customClaims || {};
        const email = user.email;
        const uid = user.uid;
        
        if (claims.role === 'admin') {
            console.log(`Found Admin in Auth: ${email} (${uid})`);
            
            // Sync to Firestore profile
            const profileRef = db.collection('profiles').doc(uid);
            const profileDoc = await profileRef.get();
            
            if (profileDoc.exists) {
                const currentRole = profileDoc.data().role;
                if (currentRole !== 'admin') {
                    console.log(`Updating Firestore role from "${currentRole}" to "admin" for ${email}`);
                    await profileRef.update({ 
                        role: 'admin',
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    updatedCount++;
                } else {
                    console.log(`Firestore role already correctly set to "admin" for ${email}`);
                }
            } else {
                console.log(`Profile document missing for ${email}, creating one...`);
                await profileRef.set({
                    full_name: user.displayName || 'Admin',
                    email: email,
                    role: 'admin',
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
                updatedCount++;
            }
        }
    }
    
    console.log(`Sync complete. Updated ${updatedCount} profiles.`);
}

syncAdminRoles().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
