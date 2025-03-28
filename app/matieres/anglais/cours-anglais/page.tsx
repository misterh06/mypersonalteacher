"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ChatBox from "./ChatBox";
import UploadZone from "./UploadZone";
import { FaDove } from "react-icons/fa";
import { Inter, Rowdies } from "next/font/google";
import { motion } from "framer-motion";
import { auth, db } from "../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const inter = Inter({ subsets: ["latin"] });
const rowdies = Rowdies({ subsets: ["latin"], weight: "400" });

export default function CoursAnglaisPage() {
  // Nouvel état pour le nombre de points
  const [noteTotal, setNoteTotal] = useState(0);

  // Récupération du nombre de points depuis Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          let total = 0;
          for (const [key, value] of Object.entries(docData)) {
            if (key.startsWith("note_") && typeof value === "number") {
              total += value;
            }
          }
          setNoteTotal(total);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/anglais.png')" }}
    >
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/70 p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/matieres/anglais/exercices"
            className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}
          >
            Exercices
          </Link>
          <Link
            href="/matieres/anglais/jeux"
            className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}
          >
            Jeux
          </Link>
          <Link
            href="/matieres/anglais/cours-anglais"
            className={`${inter.className} bg-blue-100 rounded-full px-4 py-2 shadow hover:bg-blue-200 transition text-blue-600 font-bold`}
          >
            Cours d'anglais
          </Link>
          <Link
            href="/matieres/anglais/revision"
            className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}
          >
            Révision
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-200 text-blue-800 px-8 py-1 rounded shadow">
            {noteTotal} pts
          </div>
          <Link
            href="/"
            className={`${inter.className} text-blue-600 font-bold hover:text-blue-800 transition`}
          >
            Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className={`${inter.className} text-blue-600 font-bold hover:text-blue-800 transition`}
          >
            Retour
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-16 pt-26">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          whileHover={{ scale: 1.05, rotate: -1 }}
          className={`${rowdies.className} text-5xl mb-6 inline-flex items-center gap-4 text-purple-300 group cursor-pointer`}
          style={{
            opacity: 1,
            transform: "none",
            WebkitTextStroke: "1px grey",
            textShadow: "4px 4px 8px rgba(0, 0, 0, 0.8)",
          }}
        >
          Cours d'anglais interactif
          <FaDove className="ml-2 text-orange-400 text-4xl" />
        </motion.h1>

        <div className="flex flex-col md:flex-row space-x-4">
          <div className="w-full md:w-2/3">
            <ChatBox />
          </div>
          <div className="w-full md:w-1/3">
            <UploadZone />
          </div>
        </div>
      </main>

      <footer className="p-4 text-center bg-gray-100">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
