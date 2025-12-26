import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with real config from Role A
const firebaseConfig = {
  apiKey: "AIzaSyCh58fnu6trxH71y2MDoBF_KlAs6ng-iQQ",
  authDomain: "interview-simulator-3337d.firebaseapp.com",
  projectId: "interview-simulator-3337d",
  storageBucket: "interview-simulator-3337d.firebasestorage.app",
  messagingSenderId: "193226153688",
  appId: "1:193226153688:web:7219db290ba598a82481ad",
  measurementId: "G-P54LPTNNBP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
