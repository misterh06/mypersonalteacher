"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useUserData } from "../../../../hooks/useUserData";
import { useUser } from "../../../../context/UserContext";
import { storeOrIncrementScore } from "../../../../lib/storeOrIncrementScore";
import { db, auth } from "../../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

function AiChatModal({ onClose }: { onClose: () => void }) {
  type Message = { sender: "user" | "ai"; message: string };
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;
    const userMsg: Message = { sender: "user", message: question };
    const newConversation = [...conversation, userMsg];
    setConversation(newConversation);
    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    const conversationHistory = newConversation
      .map((msg) => `${msg.sender === "user" ? "Utilisateur" : "IA"}: ${msg.message}`)
      .join("\n");

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentQuestion, mode: "help", conversationHistory }),
      });
      const data = await res.json();
      setConversation((prev) => [...prev, { sender: "ai", message: data.response }]);
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
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
      <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Aide IA</h2>
          <button onClick={onClose} className="text-red-500 font-bold text-xl">X</button>
        </div>
        <div className="mb-4 h-64 overflow-auto">
          {conversation.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
              <p className={msg.sender === "user" ? "bg-blue-100 inline-block p-2 rounded" : "bg-gray-200 inline-block p-2 rounded"}>
                {msg.message}
              </p>
            </div>
          ))}
          {loading && <p className="text-center italic">L'IA est en train de répondre...</p>}
        </div>
        <div className="flex">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-grow p-2 border rounded-l focus:outline-none"
          />
          <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderWordsPage() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, loading: userLoading } = useUser();

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
          // Calcul du total des points d'anglais
          const anglaisNotes = docData.notes?.anglais || {};
          const pointsAnglais = (anglaisNotes.exercices || 0) + 
                              (anglaisNotes.translate || 0) + 
                              (anglaisNotes.jeux?.orderwords || 0) +
                              (anglaisNotes.jeux?.irregular_verbs || 0) +
                              (anglaisNotes.jeux?.quiz || 0);
          setNoteTotal(pointsAnglais);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // État pour le thème du jeu
  const [theme, setTheme] = useState("");
  // État pour le jeu généré (chaîne JSON attendue, par exemple avec une phrase désordonnée)
  const [generatedGame, setGeneratedGame] = useState<string | null>(null);
  // Pour la réponse de l'élève (ici, on utilise un textarea pour simplifier)
  const [userAnswer, setUserAnswer] = useState("");
  // Pour le feedback
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [pointMessage, setPointMessage] = useState<string | null>(null);

  // Charger le programme (si nécessaire)
  const [programme, setProgramme] = useState<any>(null);
  const [programmeError, setProgrammeError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchProgramme() {
      if (!userClass) return;
      try {
        const res = await fetch(`/api/programme/${userClass}_anglais`);
        if (!res.ok) {
          if (res.status === 404) {
            setProgrammeError(`Le programme pour la classe de ${userClass}ème n'a pas été trouvé.`);
          } else {
            setProgrammeError(`Erreur lors du chargement du programme : ${res.statusText}`);
          }
          setProgramme(null);
          return;
        }
        const data = await res.json();
        setProgramme(data);
        setProgrammeError(null);
      } catch (error) {
        console.error("Erreur lors du chargement du programme", error);
        setProgrammeError("Une erreur est survenue lors du chargement du programme.");
        setProgramme(null);
      }
    }
    fetchProgramme();
  }, [userClass]);

  // Génération du jeu de réordonnancement
  const handleGenerateGame = async () => {
    if (!theme.trim()) {
      alert("Veuillez saisir un thème pour le jeu.");
      return;
    }
    setIsLoading(true);
    setGeneratedGame(null);
    setFeedback(null);
    setIsAnswerSubmitted(false);
    try {
      const payload = {
        mode: "orderWords", // nouveau mode pour ce jeu
        userClass,
        message: theme,
      };
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Erreur : ${data.error}`);
      } else {
        setGeneratedGame(data.response);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du jeu", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Soumission de la réponse pour correction
  const handleSubmitAnswer = async () => {
    if (!generatedGame || !user) return;
    setCheckingAnswer(true);
    setIsAnswerSubmitted(true);
    setFeedback(null);
    try {
      const payload = {
        mode: "checkOrderWords",
        game: generatedGame,
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
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentOrderWordsPoints = userData.notes?.anglais?.jeux?.orderwords || 0;
            const currentTotalAnglais = (userData.notes?.anglais?.exercices || 0) + 
                                      (userData.notes?.anglais?.translate || 0) + 
                                      (userData.notes?.anglais?.jeux?.orderwords || 0) +
                                      (userData.notes?.anglais?.jeux?.irregular_verbs || 0) +
                                      (userData.notes?.anglais?.jeux?.quiz || 0);
            
            // Mise à jour des points dans le sous-champ orderwords
            await updateDoc(userRef, {
              'notes.anglais.jeux.orderwords': currentOrderWordsPoints + 1,
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
      setCheckingAnswer(false);
    }
  };

  const content =
    userLoading || !user || !userClass ? (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des informations de l'utilisateur...
      </div>
    ) : programmeError ? (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {programmeError}
      </div>
    ) : (
      <main className="flex-grow container mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3">
            {/* Zone de saisie pour le thème et bouton de génération */}
            <div className="bg-white/80 p-4 rounded shadow-lg">
              <label className="block mb-2 font-bold">Choisissez votre thème :</label>
              <input
                type="text"
                placeholder="Exemple: fruits, animaux, etc."
                className="p-2 w-full border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  setGeneratedGame(null);
                  setFeedback(null);
                }}
              />
              <button
                onClick={handleGenerateGame}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {isLoading ? "Génération en cours..." : "Générer le jeu"}
              </button>
            </div>
            {/* Affichage du jeu généré */}
            {generatedGame && (
              <div className="mt-6 p-4 border rounded bg-white/80 shadow-sm">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Jeu généré</h2>
                {(() => {
                  try {
                    let text = generatedGame.trim();
                    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (codeBlockMatch) {
                      text = codeBlockMatch[1].trim();
                    }
                    const game = JSON.parse(text);
                    // Par exemple, on attend que le backend renvoie un objet comme :
                    // { scrambledSentence: "apple orange banana", correctOrder: "orange banana apple" }
                    return (
                      <div>
                        <p className="mb-4 font-bold">
                          Réordonnez les mots pour former une phrase correcte :
                        </p>
                        <p className="mb-4">{game.scrambledSentence}</p>
                        <label className="block font-bold mb-2">Votre réponse :</label>
                        <textarea
                          className="w-full p-2 border rounded h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={userAnswer}
                          onChange={(e) => {
                            setUserAnswer(e.target.value);
                            setFeedback(null);
                          }}
                          disabled={isAnswerSubmitted}
                        />
                      </div>
                    );
                  } catch (err) {
                    console.error("Erreur lors du parsing du jeu :", err);
                    return (
                      <div>
                        <ReactMarkdown>{generatedGame}</ReactMarkdown>
                        <label className="block font-bold mt-4 mb-2">Votre réponse :</label>
                        <textarea
                          className="w-full p-2 border rounded h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={userAnswer}
                          onChange={(e) => {
                            setUserAnswer(e.target.value);
                            setFeedback(null);
                          }}
                          disabled={isAnswerSubmitted}
                        />
                      </div>
                    );
                  }
                })()}
                <div className="mt-4">
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
                    <ReactMarkdown>{feedback}</ReactMarkdown>
                    {pointMessage && (
                      <p className="mt-2 text-green-600 font-semibold">{pointMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="md:w-1/3 md:pl-4 mt-8 md:mt-0">
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

      {showAiChat && <AiChatModal onClose={() => setShowAiChat(false)} />}
    </div>
  );
}
