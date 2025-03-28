// app/matieres/francais

'use client';
import { useState } from 'react';

// Définition du type de structure d'un quiz
type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Quiz = {
  questions: Question[];
};

export default function Francais() {
  const [question, setQuestion] = useState('');
  const [reponse, setReponse] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null); // On définit quiz comme un objet contenant des questions

  const envoyerQuestion = async () => {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode: "chat" }),
    });

    const data = await res.json();
    setReponse(data.reponse);
    setQuestion('');
  };

  const genererQuiz = async () => {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode: "quiz" }),
    });
  
    const data = await res.json();
    
    try {
      // Nettoyer la réponse de l'IA pour supprimer les balises Markdown
      const cleanedResponse = data.reponse.replace(/```json|```/g, '').trim();
      
      const parsedQuiz: Quiz = JSON.parse(cleanedResponse);
      setQuiz(parsedQuiz);
    } catch (error) {
      console.error("Erreur de parsing JSON :", error);
      setQuiz(null);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">📖 Leçon de Français</h1>

      <div className="mb-6">
        🎥 Vidéo pédagogique ici
      </div>

      <div className="mb-6">
        🎲 Exercices interactifs ici
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">💬 Pose une question à ton assistant virtuel :</h2>
        <input
          className="border p-2 rounded w-full mb-3"
          type="text"
          placeholder="Ex : Explique-moi le passé composé"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={envoyerQuestion}>
          Envoyer 🚀
        </button>

        {reponse && (
          <div className="mt-4 bg-white p-3 rounded shadow">
            <strong>Réponse :</strong> {reponse}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-100 p-4 rounded">
        <h2 className="font-semibold mb-2">📌 Générer un Quiz</h2>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={genererQuiz}>
          Générer un quiz 🤖
        </button>

        {quiz && (
          <div className="mt-4 bg-white p-3 rounded shadow">
            <h3 className="font-bold">Quiz :</h3>
            {quiz.questions.map((q, index) => (
              <div key={index} className="mt-2">
                <p><strong>{index + 1}. {q.question}</strong></p>
                <ul className="list-disc ml-5">
                  {q.options.map((option, i) => (
                    <li key={i}>{option}</li>
                  ))}
                </ul>
                <p className="text-green-600"><strong>Réponse correcte :</strong> {q.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
