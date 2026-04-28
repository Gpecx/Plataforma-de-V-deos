import { adminDb } from "../src/lib/firebase-admin";

async function checkOldData() {
    const COLLECTION = 'legal_content';
    const snapshot = await adminDb.collection(COLLECTION).get();
    console.log("Found", snapshot.size, "old documents");
    snapshot.forEach(doc => {
        console.log("ID:", doc.id);
        console.log("Title:", doc.data().title);
        console.log("Slug:", doc.data().slug);
        console.log("Content length:", doc.data().content?.length);
        console.log("---");
    });

    const SETTINGS_COLLECTION = 'settings';
    const LEGAL_DOCS_ID = 'legal_docs';
    const settingsDoc = await adminDb.collection(SETTINGS_COLLECTION).doc(LEGAL_DOCS_ID).get();
    if (settingsDoc.exists) {
        console.log("Current settings/legal_docs data:", JSON.stringify(settingsDoc.data(), null, 2));
    } else {
        console.log("settings/legal_docs does NOT exist");
    }
}

checkOldData().catch(console.error);
