import * as admin from 'firebase-admin';

function ensureAdmin() {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set');
        }

        const credentials = JSON.parse(
            serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")
                ? serviceAccountJson.slice(1, -1)
                : serviceAccountJson
        );

        admin.initializeApp({
            credential: admin.credential.cert(credentials),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${credentials.project_id}.firebaseio.com`
        });
    }
}

export function getAdminDb() {
    ensureAdmin();
    return admin.firestore();
}

export function getAdminAuth() {
    ensureAdmin();
    return admin.auth();
}

export function getAdminMessaging() {
    ensureAdmin();
    return admin.messaging();
}

export default admin;
