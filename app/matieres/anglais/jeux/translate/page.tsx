"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserData } from "../../../../hooks/useUserData";
import { useUser } from "../../../../context/UserContext";
import { FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaThumbsUp } from "react-icons/fa";
import { Inter } from "next/font/google";
import { Rowdies } from "next/font/google";
import { auth, db } from "../../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";


const rowdies = Rowdies({ subsets: ["latin"], weight: "400" });
const inter = Inter({ subsets: ["latin"] });

export default function TranslateGame() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, loading: userLoading } = useUser();

  const [direction, setDirection] = useState("en-fr");
  const [theme, setTheme] = useState("");
  const [exercise, setExercise] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [answered, setAnswered] = useState(false);
  const [noteTotal, setNoteTotal] = useState(0);
  const [pointMessage, setPointMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          // Calcul du total des points d'anglais
          const anglaisNotes = docData.notes?.anglais || {};
          const pointsAnglais = (anglaisNotes.exercices || 0) + 
                              (anglaisNotes.jeux?.translate || 0) + 
                              (anglaisNotes.jeux?.orderwords || 0) +
                              (anglaisNotes.jeux?.irregular_verbs || 0) +
                              (anglaisNotes.jeux?.quiz || 0);
          setNoteTotal(pointsAnglais);
        }
      }
    });
  
    return () => unsubscribe();
  }, []);

  const handleGenerateExercise = async () => {
    if (!theme.trim()) {
      setThemeError("Veuillez entrer un thème avant de générer l'exercice.");
      return;
    }
    setThemeError("");
    setFeedback("");
    setUserAnswer("");
    setExercise("");
    setAnswered(false);
    setLoadingExercise(true);
    try {
      const response = await fetch("/api/chatbot_bis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate",
          direction, // ajout de la direction
          message: theme,
          userClass,
          userId: user?.uid,
          exerciseId: "translate",
        }),
      });
      const data = await response.json();
      setExercise(data.response);
    } catch (error) {
      console.error("Erreur lors de la génération de l'exercice :", error);
      setFeedback("Erreur lors de la génération de l'exercice.");
    }
    setLoadingExercise(false);
  };
  

  const handleSubmitAnswer = async () => {
    if (!exercise || answered) return;
    setLoadingFeedback(true);
    try {
      const payload = {
        mode: "checkTranslate",
        game: exercise,
        userAnswer,
        userClass,
      };
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        setFeedback(`Erreur : ${data.error}`);
      } else {
        const isCorrect = /#BONNE_REPONSE#/i.test(data.response);
        const cleanedFeedback = data.response.replace(/#BONNE_REPONSE#/i, "").trim();
        setFeedback(cleanedFeedback);
        
        if (isCorrect) {
          // Mise à jour des points dans Firestore
          const userRef = doc(db, "users", user!.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentTranslatePoints = userData.notes?.anglais?.jeux?.translate || 0;
            const currentTotalAnglais = (userData.notes?.anglais?.exercices || 0) + 
                                      (userData.notes?.anglais?.jeux?.translate || 0) + 
                                      (userData.notes?.anglais?.jeux?.orderwords || 0) +
                                      (userData.notes?.anglais?.jeux?.irregular_verbs || 0) +
                                      (userData.notes?.anglais?.jeux?.quiz || 0);
            
            // Mise à jour des points dans le sous-champ translate
            await updateDoc(userRef, {
              'notes.anglais.jeux.translate': currentTranslatePoints + 1,
              'notes.anglais.total': currentTotalAnglais + 1
            });
            
            // Mise à jour du score total affiché
            setNoteTotal(prev => prev + 1);
            
            setPointMessage("✅ Point ajouté ! Total en anglais : " + (currentTotalAnglais + 1) + " points");
            setTimeout(() => setPointMessage(null), 3000);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du jeu", error);
      setFeedback("Une erreur est survenue lors de la vérification du jeu.");
    } finally {
      setLoadingFeedback(false);
    }
  };
  
  const content =
    userLoading || !user || !userClass ? (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des informations de l'utilisateur...
      </div>
    ) : (
      <>
        <main className={`${inter.className} flex-grow container mx-auto px-4 pt-24 pb-12`}>
          <div className="bg-white/90 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex justify-center">
              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                whileHover={{ scale: 1.05, rotate: -1 }}
                className={`${rowdies.className} text-5xl mb-6 inline-flex items-center gap-4 text-green-100 group cursor-pointer`}
                style={{ opacity: 1, transform: "none", WebkitTextStroke: "1px grey", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                Translate and get points
                <FaThumbsUp className="text-green-300 text-4xl drop-shadow-sm transition-transform duration-300 group-hover:rotate-12" />
              </motion.h1>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row sm:space-x-10">
              <div className={`${inter.className} flex items-center mb-4 sm:mb-0`}>
                <label htmlFor="direction" className="mr-2 font-semibold text-gray-700">
                  Direction :
                </label>
                <select
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="p-2 border border-gray-300 rounded bg-white shadow-sm focus:ring-blue-500"
                >
                  <option value="en-fr">Anglais - Français</option>
                  <option value="fr-en">Français - Anglais</option>
                </select>
              </div>
              <div className="flex-1">
                <div className={`${inter.className} flex items-center`}>
                  <label htmlFor="theme" className="mr-4 font-semibold text-gray-700 min-w-[80px]">
                    Thème :
                  </label>
                  <input
                    id="theme"
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Entrez un thème..."
                    className="p-2 border border-gray-300 rounded shadow-sm w-full focus:ring-blue-500"
                  />
                </div>
                {themeError && (
                  <p className={`${inter.className} text-red-500 text-sm mt-2 ml-[80px]`}>
                    {themeError}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerateExercise}
              className={`${inter.className} w-full bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition`}
              disabled={loadingExercise}
            >
              {loadingExercise ? "Génération en cours..." : "Générer l'exercice"}
            </button>

            {exercise && (
              <div className={`${inter.className} mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-sm`}>
                <p className="text-lg font-bold text-gray-800 mb-2">Exercice de traduction :</p>
                <p className="text-gray-700">{exercise}</p>
              </div>
            )}

            {exercise && (
              <div className={`${inter.className} mt-6`}>
                <label htmlFor="answer" className="block mb-1 font-semibold text-gray-700">
                  Votre réponse :
                </label>
                <input
                  id="answer"
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="p-2 border border-gray-300 rounded w-full shadow-sm focus:ring-blue-500"
                />
              </div>
            )}

            {exercise && (
              <div className="flex items-center mt-6">
                <button
                  onClick={handleSubmitAnswer}
                  className={`${inter.className} bg-green-400 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-green-700 transition`}
                  disabled={loadingFeedback || answered}
                >
                  {loadingFeedback ? "Vérification en cours..." : "Vérifier ma réponse"}
                </button>
                <button
                  onClick={handleGenerateExercise}
                  className="p-2 ml-4 rounded-full hover:bg-gray-200 transition"
                  title="Régénérer l'exercice"
                >
                  <FiRefreshCw className="text-2xl text-blue-600 hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>
            )}

            {feedback && (
              <div className={`${inter.className} mt-6 p-4 border rounded-lg bg-white shadow-inner text-gray-800`}>
                <p>{feedback}</p>
              </div>
            )}

            <div className={`${inter.className} mt-6 text-right text-sm text-gray-600 italic`}>
              Score : {score} / {attempts}
            </div>
          </div>
        </main>
      </>
    );

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/anglais.png')" }}
    >
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/70 p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/matieres/anglais/exercices" className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}>
            Exercices
          </Link>
          <Link href="/matieres/anglais/jeux" className={`${inter.className} bg-blue-100 rounded-full px-4 py-2 shadow hover:bg-blue-200 transition text-blue-600 font-bold`}>
            Jeux
          </Link>
          <Link href="/matieres/anglais/cours-anglais" className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}>
            Cours d'anglais
          </Link>
          <Link href="/matieres/anglais/revision" className={`${inter.className} bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold`}>
            Révision
          </Link>
        </div>
        <div className="flex items-center space-x-4">
        <div className="bg-blue-200 text-blue-800 px-8 py-1 rounded shadow">
  {noteTotal} pts
</div>
          <Link href="/" className={`${inter.className} text-blue-600 font-bold hover:text-blue-800 transition`}>
            Accueil
          </Link>
          <button onClick={() => window.history.back()} className={`${inter.className} text-blue-600 font-bold hover:text-blue-800 transition`}>
            Retour
          </button>
        </div>
      </nav>
      {content}
      <footer className={`${inter.className} p-4 text-center bg-gray-100 mt-auto`}>
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
