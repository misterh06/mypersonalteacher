"use client";

import Link from "next/link";
import { Inter } from 'next/font/google';
import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const inter = Inter({ subsets: ['latin'] });

const games = [
  { value: "crossword", label: "Crossword" },
  { value: "scramble", label: "Scramble" },
  { value: "translate", label: "Translate" },
  { value: "irregular-verbs", label: "Verbes irréguliers" },
  { value: "order-words", label: "order Words" },
  { value: "quiz", label: "Quizzz !" },
];

export default function JeuxPage() {
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
            className={`${inter.className} bg-blue-100 rounded-full px-4 py-2 shadow hover:bg-blue-200 transition text-blue-600 font-bold`}
          >
            Jeux
          </Link>
          <Link
            href="/matieres/anglais/cours-anglais"
            className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}
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

      <main className="flex-grow container mx-auto px-4 pt-40 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game) => (
            <Link key={game.value} href={`/matieres/anglais/jeux/${game.value}`}>
              <div className="bg-white p-4 rounded shadow hover:bg-blue-100 transition cursor-pointer">
                <h2 className="text-xl font-bold text-blue-600">{game.label}</h2>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="p-4 text-center bg-gray-100">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
