import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDonXCdDnV7P0maXDdB1eNpCgKi8Apvab0",
    authDomain: "libraweb-b8042.firebaseapp.com",
    projectId: "libraweb-b8042",
    storageBucket: "libraweb-b8042.firebasestorage.app",
    messagingSenderId: "69912401460",
    appId: "1:69912401460:web:dc89fbe7224bc9ad1d1c61",
    measurementId: "G-2CV3Q3433N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    return await signInWithPopup(auth, googleProvider);
};
