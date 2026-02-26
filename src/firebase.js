import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyA5jxuFQPttX-9YIh950lysjBgVDS2zRrY",
    authDomain: "medicalkisok.firebaseapp.com",
    projectId: "medicalkisok",
    storageBucket: "medicalkisok.firebasestorage.app",
    messagingSenderId: "472070781743",
    appId: "1:472070781743:web:8fda3512d3a1eb96e3ffda",
    measurementId: "G-SZ0VVQ1NLH"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export default app;
