"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useUserData } from "../../../../hooks/useUserData";
import { useUser } from "../../../../context/UserContext";
import { storeOrIncrementScore } from "../../../../lib/storeOrIncrementScore";
import { db, auth } from "../../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Liste des 100 verbes irréguliers les plus fréquents
const top100Verbs = [
  { base: "be", french: "être", past: "was/were", participle: "been" },
  { base: "have", french: "avoir", past: "had", participle: "had" },
  { base: "do", french: "faire", past: "did", participle: "done" },
  { base: "say", french: "dire", past: "said", participle: "said" },
  { base: "go", french: "aller", past: "went", participle: "gone" },
  { base: "get", french: "obtenir", past: "got", participle: "gotten" },
  { base: "make", french: "faire", past: "made", participle: "made" },
  { base: "know", french: "savoir", past: "knew", participle: "known" },
  { base: "think", french: "penser", past: "thought", participle: "thought" },
  { base: "take", french: "prendre", past: "took", participle: "taken" },
  { base: "see", french: "voir", past: "saw", participle: "seen" },
  { base: "come", french: "venir", past: "came", participle: "come" },
  { base: "want", french: "vouloir", past: "wanted", participle: "wanted" },
  { base: "look", french: "regarder", past: "looked", participle: "looked" },
  { base: "use", french: "utiliser", past: "used", participle: "used" },
  { base: "find", french: "trouver", past: "found", participle: "found" },
  { base: "give", french: "donner", past: "gave", participle: "given" },
  { base: "tell", french: "dire", past: "told", participle: "told" },
  { base: "work", french: "travailler", past: "worked", participle: "worked" },
  { base: "call", french: "appeler", past: "called", participle: "called" },
  { base: "try", french: "essayer", past: "tried", participle: "tried" },
  { base: "ask", french: "demander", past: "asked", participle: "asked" },
  { base: "need", french: "avoir besoin", past: "needed", participle: "needed" },
  { base: "feel", french: "sentir", past: "felt", participle: "felt" },
  { base: "become", french: "devenir", past: "became", participle: "become" },
  { base: "leave", french: "quitter", past: "left", participle: "left" },
  { base: "put", french: "mettre", past: "put", participle: "put" },
  { base: "mean", french: "signifier", past: "meant", participle: "meant" },
  { base: "keep", french: "garder", past: "kept", participle: "kept" },
  { base: "let", french: "laisser", past: "let", participle: "let" },
  { base: "begin", french: "commencer", past: "began", participle: "begun" },
  { base: "seem", french: "sembler", past: "seemed", participle: "seemed" },
  { base: "help", french: "aider", past: "helped", participle: "helped" },
  { base: "talk", french: "parler", past: "talked", participle: "talked" },
  { base: "turn", french: "tourner", past: "turned", participle: "turned" },
  { base: "start", french: "commencer", past: "started", participle: "started" },
  { base: "show", french: "montrer", past: "showed", participle: "shown" },
  { base: "hear", french: "entendre", past: "heard", participle: "heard" },
  { base: "play", french: "jouer", past: "played", participle: "played" },
  { base: "run", french: "courir", past: "ran", participle: "run" },
  { base: "move", french: "bouger", past: "moved", participle: "moved" },
  { base: "like", french: "aimer", past: "liked", participle: "liked" },
  { base: "live", french: "vivre", past: "lived", participle: "lived" },
  { base: "believe", french: "croire", past: "believed", participle: "believed" },
  { base: "hold", french: "tenir", past: "held", participle: "held" },
  { base: "bring", french: "apporter", past: "brought", participle: "brought" },
  { base: "happen", french: "arriver", past: "happened", participle: "happened" },
  { base: "write", french: "écrire", past: "wrote", participle: "written" },
  { base: "sit", french: "s'asseoir", past: "sat", participle: "sat" },
  { base: "stand", french: "se tenir debout", past: "stood", participle: "stood" },
  { base: "lose", french: "perdre", past: "lost", participle: "lost" },
  { base: "pay", french: "payer", past: "paid", participle: "paid" },
  { base: "meet", french: "rencontrer", past: "met", participle: "met" },
  { base: "include", french: "inclure", past: "included", participle: "included" },
  { base: "continue", french: "continuer", past: "continued", participle: "continued" },
  { base: "set", french: "fixer", past: "set", participle: "set" },
  { base: "learn", french: "apprendre", past: "learned", participle: "learned" },
  { base: "change", french: "changer", past: "changed", participle: "changed" },
  { base: "lead", french: "mener", past: "led", participle: "led" },
  { base: "understand", french: "comprendre", past: "understood", participle: "understood" },
  { base: "watch", french: "regarder", past: "watched", participle: "watched" },
  { base: "follow", french: "suivre", past: "followed", participle: "followed" },
  { base: "stop", french: "arrêter", past: "stopped", participle: "stopped" },
  { base: "create", french: "créer", past: "created", participle: "created" },
  { base: "speak", french: "parler", past: "spoke", participle: "spoken" },
  { base: "read", french: "lire", past: "read", participle: "read" },
  { base: "allow", french: "permettre", past: "allowed", participle: "allowed" },
  { base: "add", french: "ajouter", past: "added", participle: "added" },
  { base: "spend", french: "dépenser", past: "spent", participle: "spent" },
  { base: "grow", french: "grandir", past: "grew", participle: "grown" },
  { base: "open", french: "ouvrir", past: "opened", participle: "opened" },
  { base: "walk", french: "marcher", past: "walked", participle: "walked" },
  { base: "win", french: "gagner", past: "won", participle: "won" },
  { base: "offer", french: "offrir", past: "offered", participle: "offered" },
  { base: "remember", french: "se souvenir", past: "remembered", participle: "remembered" },
  { base: "love", french: "aimer", past: "loved", participle: "loved" },
  { base: "consider", french: "considérer", past: "considered", participle: "considered" },
  { base: "appear", french: "apparaître", past: "appeared", participle: "appeared" },
  { base: "buy", french: "acheter", past: "bought", participle: "bought" },
  { base: "wait", french: "attendre", past: "waited", participle: "waited" },
  { base: "serve", french: "servir", past: "served", participle: "served" },
  { base: "die", french: "mourir", past: "died", participle: "died" },
  { base: "send", french: "envoyer", past: "sent", participle: "sent" },
  { base: "expect", french: "attendre", past: "expected", participle: "expected" },
  { base: "build", french: "construire", past: "built", participle: "built" },
  { base: "stay", french: "rester", past: "stayed", participle: "stayed" },
  { base: "fall", french: "tomber", past: "fell", participle: "fallen" },
  { base: "cut", french: "couper", past: "cut", participle: "cut" },
  { base: "reach", french: "atteindre", past: "reached", participle: "reached" },
  { base: "kill", french: "tuer", past: "killed", participle: "killed" },
  { base: "remain", french: "rester", past: "remained", participle: "remained" },
  { base: "suggest", french: "suggérer", past: "suggested", participle: "suggested" },
  { base: "raise", french: "élever", past: "raised", participle: "raised" },
  { base: "pass", french: "passer", past: "passed", participle: "passed" },
  { base: "sell", french: "vendre", past: "sold", participle: "sold" },
  { base: "require", french: "exiger", past: "required", participle: "required" },
  { base: "report", french: "rapporter", past: "reported", participle: "reported" },
  { base: "decide", french: "décider", past: "decided", participle: "decided" },
  { base: "pull", french: "tirer", past: "pulled", participle: "pulled" },
  { base: "return", french: "retourner", past: "returned", participle: "returned" },
];

// Découper la liste en 3 sous-listes
const listA = top100Verbs.slice(0, 10);   // 10 verbes
const listB = top100Verbs.slice(10, 50);  // 40 verbes
const listC = top100Verbs.slice(50, 100); // 50 verbes

const allFields = ["french", "base", "past", "participle"];

export default function IrregularVerbsGame() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, loading: userLoading } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

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

  // États
  const [currentVerb, setCurrentVerb] = useState<any>(null);
  const [missingCount, setMissingCount] = useState<number>(1);
  const [verbCount, setVerbCount] = useState<number>(10);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});

  // Sélectionner aléatoirement "count" champs parmi allFields
  const pickRandomFields = (count: number): string[] => {
    const fields = [...allFields];
    const selected: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * fields.length);
      selected.push(fields[idx]);
      fields.splice(idx, 1);
    }
    return selected;
  };

  // Choisir un verbe aléatoire en fonction de verbCount
  const pickRandomVerb = () => {
    let currentVerbList: any[] = [];
    if (verbCount === 10) {
      currentVerbList = listA;
    } else if (verbCount === 50) {
      currentVerbList = [...listA, ...listB];
    } else if (verbCount === 100) {
      currentVerbList = [...listA, ...listB, ...listC];
    }
    const randomVerb = currentVerbList[Math.floor(Math.random() * currentVerbList.length)];
    const fieldsToMask = pickRandomFields(missingCount);
    setCurrentVerb(randomVerb);
    setMissingFields(fieldsToMask);
    setSelectedAnswers({});
    setFeedback("");
    setEditingFields({});
  };

  // Passage au champ suivant ou soumission via Enter
  const handleKeyDown = (field: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const index = missingFields.indexOf(field);
      if (index >= 0 && index < missingFields.length - 1) {
        const nextField = missingFields[index + 1];
        setEditingFields((prev) => ({
          ...prev,
          [field]: false,
          [nextField]: true,
        }));
      } else {
        // Dernier champ : soumission
        handleSubmit();
      }
    }
  };

  // Vérification des réponses
  const fieldLabels: { [key: string]: string } = {
    french: "l'infinitif français",
    base: "l'infinitif anglais",
    past: "le Past Simple",
    participle: "le Past Participle",
  };
  const handleSubmit = async () => {
    if (!currentVerb) return;
    let allCorrect = true;
    let msg = "";
    missingFields.forEach((field) => {
      const correct = currentVerb[field].toLowerCase();
      if ((selectedAnswers[field] || "").trim().toLowerCase() !== correct) {
        allCorrect = false;
        msg += `Pour ${fieldLabels[field]}, la bonne réponse est "${currentVerb[field]}". `;
      }
    });
    if (allCorrect) {
      msg = "Bravo! Vos réponses sont correctes! 😄";
      setScore((prev) => prev + 1);
      
      // Mise à jour des points dans Firestore
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentPoints = userData.notes?.anglais?.jeux?.irregular_verbs || 0;
          const pointsToAdd = 1; // 1 point par verbe correct
          
          // Mise à jour des points dans le sous-champ irregular_verbs
          await updateDoc(userRef, {
            'notes.anglais.jeux.irregular_verbs': currentPoints + pointsToAdd,
            totalPoints: (userData.totalPoints || 0) + pointsToAdd
          });
          
          // Ajout d'un message de félicitations
          msg += `\n\n🎉 Bravo ! Vous avez gagné ${pointsToAdd} point ! Total en verbes irréguliers : ${currentPoints + pointsToAdd} points`;
        }
      }
    } else {
      msg = "Oups! " + msg + "Essayez encore!";
    }
    setFeedback(msg);
    setAttempts((prev) => prev + 1);
  };

  const handleInputChange = (field: string, value: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditClick = (field: string) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleMissingCountChange = (value: number) => {
    setMissingCount(value);
  };

  const handleVerbCountChange = (value: number) => {
    setVerbCount(value);
  };

  useEffect(() => {
    pickRandomVerb();
  }, [missingCount, verbCount]);

  useEffect(() => {
    pickRandomVerb();
  }, []);

  const content =
    userLoading || !user || !userClass ? (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des informations de l'utilisateur...
      </div>
    ) : (
      <main className="flex-grow container mx-auto px-4 py-8 pt-30">
        <div className="bg-white/80 p-4 rounded shadow-lg">
          <div className="mb-4 flex space-x-4">
            <div className="flex items-center">
              <label htmlFor="missingCount" className="mr-2">
                Nombre de cases à trouver :
              </label>
              <select
                id="missingCount"
                className="p-2 border rounded bg-white text-black"
                value={missingCount}
                onChange={(e) => handleMissingCountChange(Number(e.target.value))}
              >
                <option value={1}>1 case</option>
                <option value={2}>2 cases</option>
                <option value={3}>3 cases</option>
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="verbCount" className="mr-2">
                Nombre de verbes à réviser :
              </label>
              <select
                id="verbCount"
                className="p-2 border rounded bg-white text-black"
                value={verbCount}
                onChange={(e) => handleVerbCountChange(Number(e.target.value))}
              >
                <option value={10}>10 Facile</option>
                <option value={50}>50 Difficile</option>
                <option value={100}>100 Pour les champions !</option>
              </select>
            </div>
          </div>
          {currentVerb && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Infinitif français */}
                <div className="p-4 border rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Infinitif français</p>
                  {missingFields.includes("french") ? (
                    editingFields["french"] ? (
                      <input
                        type="text"
                        value={selectedAnswers["french"] || ""}
                        onChange={(e) => handleInputChange("french", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("french", e)}
                        autoFocus
                        className="font-bold text-xl border-b border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="font-bold text-xl cursor-pointer"
                        onClick={() => handleEditClick("french")}
                      >
                        {selectedAnswers["french"] ? selectedAnswers["french"] : "?"}
                      </p>
                    )
                  ) : (
                    <p className="font-bold text-xl">{currentVerb.french}</p>
                  )}
                </div>
                {/* Infinitif anglais */}
                <div className="p-4 border rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Infinitif anglais</p>
                  {missingFields.includes("base") ? (
                    editingFields["base"] ? (
                      <input
                        type="text"
                        value={selectedAnswers["base"] || ""}
                        onChange={(e) => handleInputChange("base", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("base", e)}
                        autoFocus
                        className="font-bold text-xl border-b border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="font-bold text-xl cursor-pointer"
                        onClick={() => handleEditClick("base")}
                      >
                        {selectedAnswers["base"] ? selectedAnswers["base"] : "?"}
                      </p>
                    )
                  ) : (
                    <p className="font-bold text-xl">{currentVerb.base}</p>
                  )}
                </div>
                {/* Past Simple */}
                <div className="p-4 border rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Past Simple</p>
                  {missingFields.includes("past") ? (
                    editingFields["past"] ? (
                      <input
                        type="text"
                        value={selectedAnswers["past"] || ""}
                        onChange={(e) => handleInputChange("past", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("past", e)}
                        autoFocus
                        className="font-bold text-xl border-b border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="font-bold text-xl cursor-pointer"
                        onClick={() => handleEditClick("past")}
                      >
                        {selectedAnswers["past"] ? selectedAnswers["past"] : "?"}
                      </p>
                    )
                  ) : (
                    <p className="font-bold text-xl">{currentVerb.past}</p>
                  )}
                </div>
                {/* Past Participle */}
                <div className="p-4 border rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Past Participle</p>
                  {missingFields.includes("participle") ? (
                    editingFields["participle"] ? (
                      <input
                        type="text"
                        value={selectedAnswers["participle"] || ""}
                        onChange={(e) => handleInputChange("participle", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("participle", e)}
                        autoFocus
                        className="font-bold text-xl border-b border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="font-bold text-xl cursor-pointer"
                        onClick={() => handleEditClick("participle")}
                      >
                        {selectedAnswers["participle"] ? selectedAnswers["participle"] : "?"}
                      </p>
                    )
                  ) : (
                    <p className="font-bold text-xl">{currentVerb.participle}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Vérifier ma réponse
          </button>
          {feedback && (
            <div className="mt-4 p-2 border rounded bg-white shadow-inner">
              <p>{feedback}</p>
              <button
                onClick={() => {
                  setFeedback("");
                  pickRandomVerb();
                }}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Next Verb
              </button>
            </div>
          )}
          <div className="mt-4">
            <p>
              Score: {score} / {attempts}
            </p>
          </div>
        </div>
      </main>
    );

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
      {content}
      <footer className="p-4 text-center bg-gray-100">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
