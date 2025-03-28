"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useUserData } from "../../../../hooks/useUserData";
import { useUser } from "../../../../context/UserContext";
import { Inter } from "next/font/google";
import { auth, db } from "../../../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const inter = Inter({ subsets: ["latin"] });

// Composant modal pour l'aide IA
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
              className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}
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
            <p className="text-center italic">L'IA est en train de répondre...</p>
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

export default function QuizPage() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, loading: userLoading, userId } = useUser();

  // État pour le nombre de points
  const [noteTotal, setNoteTotal] = useState(0);
  const [userProfile, setUserProfile] = useState<{ nom: string; prenom: string } | null>(null);

  // Récupération des points et profil utilisateur depuis Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          let total = 0;
          if (docData.notes) {
            // Calcul du total des points d'anglais
            const anglaisNotes = docData.notes.anglais || {};
            total = (anglaisNotes.exercices || 0) + 
                   (anglaisNotes.translate || 0) + 
                   (anglaisNotes.jeux?.orderwords || 0) +
                   (anglaisNotes.jeux?.irregular_verbs || 0) +
                   (anglaisNotes.jeux?.quiz || 0);
          }
          setNoteTotal(total);
          setUserProfile({
            nom: docData.nom || "",
            prenom: docData.prenom || "",
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // États du quiz
  const [quizTheme, setQuizTheme] = useState("");
  const [generatedGame, setGeneratedGame] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);

  // Chargement du programme (optionnel)
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

  // Réinitialiser les réponses sélectionnées quand le quiz généré ou le thème change
  useEffect(() => {
    setSelectedAnswers({});
  }, [generatedGame, quizTheme]);

  // Génération du quiz
  const handleGenerateGame = async () => {
    if (!quizTheme.trim()) {
      alert("Veuillez saisir un thème pour le quiz.");
      return;
    }
    setIsLoading(true);
    setGeneratedGame(null);
    setIsAnswerSubmitted(false);
    setFeedback(null);
    try {
      const payload = {
        mode: "quiz",
        userClass,
        message: quizTheme,
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
      console.error("Erreur lors de la génération du quiz", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Soumission des réponses pour correction
  const handleSubmitAnswer = async () => {
    if (!generatedGame) return;
    setCheckingAnswer(true);
    setIsAnswerSubmitted(true);
    setFeedback(null);
    try {
      const payload = {
        mode: "checkQuiz",
        quiz: generatedGame,
        studentAnswers: selectedAnswers,
        userClass,
        userId,
        exerciseId: "quiz01",
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
        setFeedback(data.response);
        if (data.note !== undefined && data.note !== null) {
          setFeedback(prev => `Note obtenue : ${data.note}/3\n\n${prev}`);
          
          // Mise à jour des points dans Firestore
          if (user?.uid) {
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const currentPoints = userData.notes?.anglais?.jeux?.quiz || 0;
              
              // Mise à jour des points dans le sous-champ quiz
              await updateDoc(userRef, {
                'notes.anglais.jeux.quiz': currentPoints + data.note,
                totalPoints: (userData.totalPoints || 0) + data.note
              });
              
              // Mise à jour du score total affiché
              setNoteTotal(prev => prev + data.note);
              
              // Ajout d'un message de félicitations
              setFeedback(prev => `${prev}\n\n🎉 Bravo ! Vous avez gagné ${data.note} points ! Total en quiz : ${currentPoints + data.note} points`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du quiz", error);
      setFeedback("Une erreur est survenue lors de la vérification du quiz.");
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
      <main className="pt-30 flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3">
            {/* Zone de saisie pour le thème et bouton de génération */}
            <div className="bg-white/80 p-4 rounded shadow-lg">
              <label className="block mb-2 font-bold">Thème du quiz :</label>
              <input
                type="text"
                placeholder="Entrez un thème (ex: animaux)"
                className="p-2 w-full border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={quizTheme}
                onChange={(e) => {
                  setQuizTheme(e.target.value);
                  setGeneratedGame(null);
                  setFeedback(null);
                }}
              />
              <button
                onClick={handleGenerateGame}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {isLoading ? "Génération en cours..." : "Générer le quiz"}
              </button>
            </div>
            {/* Affichage du quiz généré */}
            {generatedGame && (
              <div className="mt-6 p-4 border rounded bg-white/80 shadow-sm">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Quiz généré</h2>
                {(() => {
                  try {
                    let quizStr = generatedGame;
                    if (quizStr.trim().startsWith("```")) {
                      quizStr = quizStr
                        .replace(/^```(json)?\s*/, "")
                        .replace(/\s*```$/, "")
                        .trim();
                    }
                    const quiz = JSON.parse(quizStr);
                    return (
                      <div>
                        {quiz.questions.map((q: any, idx: number) => (
                          <div key={idx} className="mb-4">
                            <div className="mb-2">
                              {/* Affichage de la question en anglais via ReactMarkdown */}
                              <ReactMarkdown>{q.question}</ReactMarkdown>
                              {/* Affichage de la traduction */}
                              <p className="text-gray-600">{q.Traduction}</p>
                            </div>
                            <div>
                              {q.options.map((opt: string, i: number) => (
                                <label key={i} className="block">
                                  <input
                                    type="radio"
                                    name={`question-${idx}`}
                                    value={opt}
                                    checked={selectedAnswers[idx] === opt}
                                    onChange={(e) =>
                                      setSelectedAnswers({
                                        ...selectedAnswers,
                                        [idx]: e.target.value,
                                      })
                                    }
                                    className="mr-2"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch (err) {
                    console.error("Erreur lors du parsing du quiz :", err);
                    return <pre>{generatedGame}</pre>;
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
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="md:w-1/3 md:pl-4 mt-8 md:mt-0">
            <button
              onClick={() => setShowAiChat(true)}
              className="p-2 hover:opacity-80 ml-[350px]"
            >
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
      {/* Header */}
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
