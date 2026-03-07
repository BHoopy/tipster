import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        try {
            // Handle potential single quotes or escaped characters from .env
            const credentials = JSON.parse(serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")
                ? serviceAccountJson.slice(1, -1)
                : serviceAccountJson);

            admin.initializeApp({
                credential: admin.credential.cert(credentials),
                databaseURL: `https://${credentials.project_id}.firebaseio.com`
            });
        } catch (error) {
            console.error('Firebase admin initialization error:', error);
        }
    } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not found in environment variables');
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
