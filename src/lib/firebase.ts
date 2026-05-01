import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Configuration Source of Truth: 
// 1. Vite injected local config (AI Studio)
// 2. Environment variables (Vercel/Production)
declare const __FIREBASE_CONFIG__: any;

const injectedConfig = typeof __FIREBASE_CONFIG__ !== 'undefined' ? __FIREBASE_CONFIG__ : {};

const firebaseConfig = {
  apiKey: injectedConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: injectedConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: injectedConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: injectedConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: injectedConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: injectedConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: injectedConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Helper for User Profiles
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const createUserProfile = async (user: any) => {
  const docRef = doc(db, 'users', user.uid);
  await setDoc(docRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    watchlist: ['AAPL', 'BTC-USD', 'EURUSD=X'],
    lastLogin: new Date().toISOString()
  }, { merge: true });
};

export const toggleWatchlist = async (uid: string, symbol: string, isAdding: boolean) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    watchlist: isAdding ? arrayUnion(symbol) : arrayRemove(symbol)
  });
};
