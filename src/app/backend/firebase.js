// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAEHJkZhm38w7rVDGGEXHyiydWDzLyo5vs",
    authDomain: "quintelligence-fb684.firebaseapp.com",
    projectId: "quintelligence-fb684",
    storageBucket: "quintelligence-fb684.firebasestorage.app",
    messagingSenderId: "175484144384",
    appId: "1:175484144384:web:e3c68c9d82a61b08e801e5",
    measurementId: "G-TEE1R0TD31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup };