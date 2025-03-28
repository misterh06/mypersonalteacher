"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useUserData } from "../../../hooks/useUserData";
import { useUser } from "../../../context/UserContext";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebaseConfig";

// Composant modal pour communiquer avec l'IA en mode "help"
function AiChatModal({ onClose, userId }: { onClose: () => void; userId: string | null }) {

  // Définition explicite du type de conversation
  type Message = { sender: "user" | "ai"; message: string };
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;
    // Ajout du message utilisateur à la conversation
    const userMsg: Message = { sender: "user", message: question };
    const newConversation = [...conversation, userMsg];
    setConversation(newConversation);
    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    // Construction de l'historique de la conversation en chaîne de caractères
    const conversationHistory = newConversation
      .map((msg) => `${msg.sender === "user" ? "Utilisateur" : "IA"}: ${msg.message}`)
      .join("\n");

    console.log("Historique de conversation:", conversationHistory);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentQuestion, mode: "help", conversationHistory, userId }),
      });
      const data = await res.json();
      setConversation((prev) => [
        ...prev,
        { sender: "ai", message: data.response },
      ]);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        { sender: "ai", message: "Erreur lors de la récupération de l'aide." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fond de la modale rendu transparent
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
      <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Aide IA</h2>
          <button onClick={onClose} className="text-red-500 font-bold text-xl">
            X
          </button>
        </div>
        <div className="mb-4 h-64 overflow-auto">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.sender === "user" ? "text-right" : "text-left"
              }`}
            >
              <p
                className={
                  msg.sender === "user"
                    ? "bg-blue-100 inline-block p-2 rounded"
                    : "bg-gray-200 inline-block p-2 rounded"
                }
              >
                {msg.message}
              </p>
            </div>
          ))}
          {loading && (
            <p className="text-center italic">
              L'IA est en train de répondre...
            </p>
          )}
        </div>
        <div className="flex">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-grow p-2 border rounded-l focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExercicesAnglaisPage() {
  // Récupération des informations de l'utilisateur et de sa classe
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, userId, loading: userLoading } = useUser();
  
  // Nouveau state pour le nombre de points
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

  // États pour le programme d'anglais
  const [programme, setProgramme] = useState<any>(null);
  const [programmeError, setProgrammeError] = useState<string | null>(null);

  // États pour la génération d'exercice et la correction
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [generatedExercise, setGeneratedExercise] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [note, setNote] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkingAnswer, setCheckingAnswer] = useState<boolean>(false);

  // États pour l'affichage des modaux
  const [showAiChat, setShowAiChat] = useState<boolean>(false);

  // Domaines fixes pour l'anglais
  const englishDomains = [
    { value: "themes_culturels", label: "Thèmes culturels" },
    { value: "contenus_linguistiques", label: "Contenus linguistiques" },
  ];

  // Chargement du programme d'anglais en fonction de la classe
  useEffect(() => {
    async function fetchProgramme() {
      if (!userClass) return;
      try {
        const res = await fetch(`/api/programme/${userClass}_anglais`);
        if (!res.ok) {
          if (res.status === 404) {
            setProgrammeError(
              `Le programme pour la classe de ${userClass}ème n'a pas été trouvé.`
            );
          } else {
            setProgrammeError(
              `Erreur lors du chargement du programme : ${res.statusText}`
            );
          }
          setProgramme(null);
          return;
        }
        const data = await res.json();
        setProgramme(data);
        setProgrammeError(null);
      } catch (error) {
        console.error("Erreur lors du chargement du programme", error);
        setProgrammeError(
          "Une erreur est survenue lors du chargement du programme."
        );
        setProgramme(null);
      }
    }
    fetchProgramme();
  }, [userClass]);

  // Construction de la liste des chapitres en fonction du domaine et de la classe
  let chapters: { titre: string; sous_chapitres: string[] }[] = [];
  if (programme && selectedDomain && userClass) {
    const key = `Langues vivantes étrangères - Anglais (${userClass}ème)`;
    const englishProgram = programme.programme?.[key];
    if (englishProgram) {
      if (selectedDomain === "themes_culturels") {
        chapters = englishProgram.themes_culturels?.chapitres || [];
      } else if (selectedDomain === "contenus_linguistiques") {
        chapters = englishProgram.contenus_linguistiques?.chapitres || [];
      }
    }
  }

  // Fonction pour générer un exercice via l'API d'anglais
  const handleGenerateExercise = async () => {
    if (!selectedDomain || !selectedChapter) {
      alert("Veuillez sélectionner un domaine et un chapitre.");
      return;
    }
    setIsLoading(true);
    setGeneratedExercise(null);
    setUserAnswer("");
    setIsAnswerSubmitted(false);
    setFeedback(null);
    try {
      const res = await fetch("/api/matieres/anglais/generateExercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomain,
          chapter: selectedChapter,
          userClass,
          userId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Erreur : ${data.error}`);
      } else {
        setGeneratedExercise(data.exercise);
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'exercice", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour soumettre la réponse via l'API d'anglais
  const handleSubmitAnswer = async () => {
    if (!generatedExercise) return;
    setCheckingAnswer(true);
    setIsAnswerSubmitted(true);
    setFeedback(null);
  
    try {
      const res = await fetch("/api/matieres/anglais/checkAnswer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: generatedExercise,
          userAnswer: userAnswer,
          userClass,
          userId,            
          exerciseId: "ex01"
        }),
      });
      const data = await res.json();
  
      if (data.error) {
        setFeedback(`Erreur : ${data.error}`);
      } else {
        setFeedback(data.feedback);
        setNote(data.note);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la réponse", error);
      setFeedback("Une erreur est survenue lors de la vérification de la réponse.");
    } finally {
      setCheckingAnswer(false);
    }
  };
  

  // Rendu conditionnel selon l'état utilisateur et du programme
  const content =
    userLoading || userDataLoading ? (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des informations de l'utilisateur...
      </div>
    ) : !user ? (
      <div className="flex items-center justify-center min-h-screen">
        Vous devez être connecté pour accéder à cette page.
      </div>
    ) : !userClass ? (
      <div className="flex items-center justify-center min-h-screen">
        Veuillez renseigner votre classe dans votre profil.
      </div>
    ) : programmeError ? (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {programmeError}
      </div>
    ) : !programme ? (
      <div className="flex items-center justify-center min-h-screen">
        Chargement du programme...
      </div>
    ) : (
      // Mise en page à deux colonnes
      <main className="flex-grow container mx-auto px-4 pt-26 py-8">
        <div className="flex flex-col md:flex-row">
          {/* Colonne de gauche : Génération des exercices */}
          <div className="md:w-2/3">
            <div className="bg-white/80 p-4 rounded shadow-lg">
              {/* Sélection du domaine */}
              <label className="block mb-2 font-bold">
                Sélectionnez un domaine :
              </label>
              <select
                className="p-2 w-full border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setSelectedChapter("");
                  setGeneratedExercise(null);
                  setUserAnswer("");
                  setIsAnswerSubmitted(false);
                  setFeedback(null);
                }}
              >
                <option value="">-- Choisissez un domaine --</option>
                {englishDomains.map((dom) => (
                  <option key={dom.value} value={dom.value}>
                    {dom.label}
                  </option>
                ))}
              </select>
              {/* Sélection du chapitre */}
              {selectedDomain && (
                <div className="mt-4">
                  <label className="block mb-2 font-bold">
                    Sélectionnez un chapitre :
                  </label>
                  <select
                    className="p-2 w-full border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedChapter}
                    onChange={(e) => {
                      setSelectedChapter(e.target.value);
                      setGeneratedExercise(null);
                      setUserAnswer("");
                      setIsAnswerSubmitted(false);
                      setFeedback(null);
                    }}
                  >
                    <option value="">-- Choisissez un chapitre --</option>
                    {chapters.map((chap, index) => (
                      <option key={index} value={chap.titre}>
                        {chap.titre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Bouton pour générer l'exercice */}
              <button
                onClick={handleGenerateExercise}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {isLoading ? "Génération en cours..." : "Générer l'exercice"}
              </button>
            </div>
            {/* Affichage de l'exercice généré */}
            {generatedExercise && (
              <div className="mt-6 p-4 border rounded bg-white/80 shadow-sm">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Exercice généré
                </h2>
                <ReactMarkdown>{generatedExercise}</ReactMarkdown>
                {/* Zone de réponse */}
                <div className="mt-4">
                  <label className="block font-bold mb-2">Votre réponse :</label>
                  <textarea
                    className="w-full p-2 border rounded h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isAnswerSubmitted}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    disabled={isAnswerSubmitted || checkingAnswer}
                  >
                    {checkingAnswer ? "Vérification en cours..." : "Soumettre"}
                  </button>
                </div>
                {feedback && (
  <div className="mt-4 p-2 border rounded bg-white shadow-inner">
    {note !== null && (
      <div className="text-green-700 font-bold mb-2">
        ✅ Note obtenue : {note}/10
      </div>
    )}
    <ReactMarkdown>{feedback}</ReactMarkdown>
  </div>
)}
              </div>
            )}
          </div>
          {/* Colonne de droite : Zone des outils */}
          <div className="md:w-1/3 md:pl-4 mt-8 md:mt-0">
            {/* Bouton pour l'aide (Help), décalé de 50px */}
            <button onClick={() => setShowAiChat(true)} className="p-2 hover:opacity-80 ml-[350px]">
              <img src="/help.png" alt="Help" className="w-25 h-25" />
            </button>
          </div>
        </div>
      </main>
    );

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/anglais.png')" }}
    >
      {/* Barre de navigation avec cards arrondies et liens supplémentaires */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/70 p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/matieres/anglais/exercices"
            className="bg-blue-100 rounded-full px-4 py-2 shadow hover:bg-blue-200 transition text-blue-600 font-bold"
          >
            Exercices
          </Link>
          <Link
            href="/matieres/anglais/jeux"
            className="bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold"
          >
            Jeux
          </Link>
          <Link
            href="/matieres/anglais/cours-anglais"
            className="bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold"
          >
            Cours d'anglais
          </Link>
          <Link
            href="/matieres/anglais/revision"
            className="bg-white rounded-full px-4 py-2 shadow hover:bg-blue-100 transition text-blue-600 font-bold"
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
            className="text-blue-600 font-bold hover:text-blue-800 transition"
          >
            Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 font-bold hover:text-blue-800 transition"
          >
            Retour
          </button>
        </div>
      </nav>

      {content}

      {/* Footer */}
      <footer className="p-4 text-center bg-gray-100">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>

      {/* Modale de chat pour l'aide IA */}
      {showAiChat && <AiChatModal onClose={() => setShowAiChat(false)} userId={userId} />}

    </div>
  );
}
