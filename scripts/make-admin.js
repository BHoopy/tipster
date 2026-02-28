const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function makeAdmin() {
  try {
    const email = 'wormz@gmail.com';
    
    const user = await auth.getUserByEmail(email);
    
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'admin',
      createdAt: new Date(),
    }, { merge: true });

    console.log(`✓ Successfully made ${email} an admin!`);
    console.log(`User UID: ${user.uid}`);
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTo fix:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "service-account.json" in this folder');
    console.log('4. Run: node scripts/make-admin.js');
  }
}

makeAdmin();
