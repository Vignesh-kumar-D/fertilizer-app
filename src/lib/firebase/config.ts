// lib/firebase/config.js
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics;
if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
}

// Initialize Firebase only once

// Connect to local emulators in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment these when you set up local emulators
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectStorageEmulator(storage, 'localhost', 9199);
}
if (typeof window === 'undefined') {
  app = {} as FirebaseApp;

  db = {} as Firestore;

  auth = {} as Auth;

  storage = {} as FirebaseStorage;
}
export { app, db, auth, storage, analytics };
