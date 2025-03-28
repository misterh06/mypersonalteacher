// lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzEuW_3YK4QCsl9dGvLdO2kVvlBnfZbaM",
  authDomain: "my-personal-teacher-f633d.firebaseapp.com",
  projectId: "my-personal-teacher-f633d",
  storageBucket: "my-personal-teacher-f633d.firebasestorage.app",
  messagingSenderId: "866512407278",
  appId: "1:866512407278:web:b6c50e943a37bfb5bbc1ff",
  measurementId: "G-5S4LWNZEC0"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
