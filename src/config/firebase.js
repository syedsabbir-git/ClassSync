import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';
const firebaseConfig = {
  apiKey: "AIzaSyA3mbGuCHG_Q8rlFgfYPV9Iaglkh7Zn1zU",
  authDomain: "classsyncweb.firebaseapp.com",
  projectId: "classsyncweb",
  storageBucket: "classsyncweb.firebasestorage.app",
  messagingSenderId: "361316260999",
  appId: "1:361316260999:web:8cae47738a9c9d82b3ec22",
  measurementId: "G-TNNJ8MFTGW"
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export default app;