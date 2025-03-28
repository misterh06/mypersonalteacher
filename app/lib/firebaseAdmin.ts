// lib/firebaseAdmin.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Initialisation de Firebase Admin (à faire une seule fois)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS!)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export { getStorage };
