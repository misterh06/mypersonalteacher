"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useUserData } from "../../../hooks/useUserData";
import { useUser } from "../../../context/UserContext";
import GeometryBoard from "./GeometryBoard"; // Import du composant GeometryBoard

// Composant de la calculatrice scientifique
function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [memory, setMemory] = useState<number>(0);

  // Permet la saisie au clavier
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(e.target.value);
  };

  // Fonction d'évaluation de l'expression avec remplacement des fonctions
  const evaluateExpression = (expr: string): string => {
    try {
      let exp = expr;
      exp = exp.replace(/√\(/g, "Math.sqrt(");
      exp = exp.replace(/sin\(/g, "Math.sin(");
      exp = exp.replace(/cos\(/g, "Math.cos(");
      exp = exp.replace(/tan\(/g, "Math.tan(");
      // Pour Windows, la fonction log correspond à log10
      exp = exp.replace(/log\(/g, "Math.log10(");
      exp = exp.replace(/π/g, "Math.PI");
      exp = exp.replace(/%/g, "/100");
      // eslint-disable-next-line no-eval
      const evalResult = eval(exp);
      return evalResult.toString();
    } catch (error) {
      return "Erreur";
    }
  };

  const calculate = () => {
    const res = evaluateExpression(expression);
    setResult(res);
  };

  const toggleSign = () => {
    if (expression.startsWith("-")) {
      setExpression(expression.substring(1));
    } else {
      setExpression("-" + expression);
    }
  };

  // Gestion des actions spécifiques en fonction du bouton cliqué
  const handleButtonClick = (btn: string) => {
    if (btn === "MC") {
      setMemory(0);
    } else if (btn === "MR") {
      setExpression(memory.toString());
    } else if (btn === "M+") {
      const val = parseFloat(evaluateExpression(expression));
      if (!isNaN(val)) {
        setMemory(memory + val);
      }
    } else if (btn === "M-") {
      const val = parseFloat(evaluateExpression(expression));
      if (!isNaN(val)) {
        setMemory(memory - val);
      }
    } else if (btn === "←") {
      setExpression(expression.slice(0, -1));
    } else if (btn === "CE") {
      setExpression("");
    } else if (btn === "C") {
      setExpression("");
      setMemory(0);
      setResult("");
    } else if (btn === "±") {
      toggleSign();
    } else if (btn === "x²") {
      const val = parseFloat(evaluateExpression(expression));
      if (!isNaN(val)) {
        setExpression((val * val).toString());
      }
    } else if (btn === "1/x") {
      const val = parseFloat(evaluateExpression(expression));
      if (!isNaN(val) && val !== 0) {
        setExpression((1 / val).toString());
      } else {
        setResult("Erreur");
      }
    } else if (
      btn === "√" ||
      btn === "sin" ||
      btn === "cos" ||
      btn === "tan" ||
      btn === "log"
    ) {
      setExpression(expression + btn + "(");
    } else if (btn === "π") {
      setExpression(expression + "π");
    } else if (btn === "%") {
      setExpression(expression + "%");
    } else {
      // Pour les chiffres, opérateurs, point, etc.
      setExpression(expression + btn);
    }
  };

  // Organisation des boutons en lignes
  const buttonRows = [
    ["MC", "MR", "M+", "M-"],
    ["←", "CE", "C", "±"],
    ["√", "x²", "1/x", "%"],
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "π", "+"],
    ["sin", "cos", "tan", "log"],
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">

      <div className="bg-gradient-to-br from-blue-200 to-purple-200 p-4 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold text-gray-800">Calculatrice Scientifique</h2>
          <button onClick={onClose} className="text-red-600 font-bold text-2xl">
            &times;
          </button>
        </div>
        {/* Zone d'affichage avec saisie clavier */}
        <div className="mb-3">
          <input
            type="text"
            value={expression}
            onChange={handleInputChange}
            placeholder="Entrez l'expression"
            className="w-full p-2 border rounded text-right text-xl font-mono"
          />
          <input
            type="text"
            readOnly
            value={result}
            placeholder="Résultat"
            className="w-full p-2 border rounded mt-1 text-right text-xl font-mono bg-white"
          />
        </div>
        {/* Grille des boutons */}
        <div className="grid grid-cols-4 gap-2">
          {buttonRows.map((row, rowIndex) =>
            row.map((btn, btnIndex) => (
              <button
                key={`${rowIndex}-${btnIndex}`}
                onClick={() => handleButtonClick(btn)}
                className="bg-white hover:bg-blue-100 active:bg-blue-200 rounded shadow py-2 text-lg font-semibold"
              >
                {btn}
              </button>
            ))
          )}
          <button
            onClick={calculate}
            className="col-span-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded shadow py-2 text-xl font-bold mt-2"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}

interface Domain {
  name: string;
  chapitres: {
    titre: string;
    sous_chapitres: string[];
  }[];
}

export default function ExercicesPage() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { user, loading: userLoading } = useUser();
  const [programme, setProgramme] = useState<{ domains: Domain[] } | null>(null);
  const [programmeError, setProgrammeError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [generatedExercise, setGeneratedExercise] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string>("text");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checkingAnswer, setCheckingAnswer] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Chargement dynamique du programme selon la classe de l'élève
  useEffect(() => {
    async function fetchProgramme() {
      if (!userClass) return;
      try {
        const res = await fetch(`/api/programme/${userClass}_maths`);
        if (!res.ok) {
          if (res.status === 404) {
            setProgrammeError(`Le programme pour la classe de ${userClass}ème n'a pas été trouvé.`);
          } else {
            setProgrammeError(`Erreur lors du chargement du programme : ${res.statusText}`);
          }
          setProgramme(null);
          return;
        }
        const text = await res.text();
        console.log("Réponse brute :", text);
        const data = JSON.parse(text);
        console.log("Données parsées :", data);
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

  if (userLoading || userDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des informations de l'utilisateur...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Vous devez être connecté pour accéder à cette page.
      </div>
    );
  }

  if (!userClass) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Veuillez renseigner votre classe dans votre profil.
      </div>
    );
  }

  if (programmeError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{programmeError}</div>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement du programme...
      </div>
    );
  }

  // Récupérer les domaines du programme
  console.log("Programme complet :", programme);
  const domains = programme?.domains || [];

  // Récupérer les chapitres du domaine sélectionné
  let chapters: { titre: string; sous_chapitres: string[] }[] = [];
  if (selectedDomain) {
    const domain = domains.find((d: Domain) => d.name === selectedDomain);
    if (domain) {
      chapters = domain.chapitres;
    }
  }

  // Fonction pour générer un exercice via l'API
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
      const res = await fetch("/api/matieres/maths/generateExercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, chapter: selectedChapter, userClass }),
      });
      const data = await res.json();
      setGeneratedExercise(data.exercise);
      setExerciseType(data.type || "text");
    } catch (error) {
      console.error("Erreur lors de la génération de l'exercice", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour soumettre la réponse
  const handleSubmitAnswer = async () => {
    if (!generatedExercise) return;
    setCheckingAnswer(true);
    setIsAnswerSubmitted(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/matieres/maths/checkAnswer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: generatedExercise,
          userAnswer: userAnswer,
          userClass: userClass,
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error("Erreur lors de la vérification de la réponse", error);
      setFeedback("Une erreur est survenue lors de la vérification de la réponse.");
    } finally {
      setCheckingAnswer(false);
    }
  };

  return (
    <div
      className="
        flex flex-col h-screen 
        bg-[url('/math_exercices.png')]
        bg-cover
        bg-no-repeat
        bg-fixed
      "
    >
      
      
      {/* Header global */}
      <header className="shadow bg-white">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    {/* Colonne de gauche : titre */}
    <div className="text-2xl font-bold">Exercices de Mathématiques</div>
    
    {/* Colonne centrale : icône de la calculatrice */}
    
    
    {/* Colonne de droite : navigation */}
    <nav className="space-x-4">
      <Link href="/">Accueil</Link>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.history.back();
        }}
      >
        Retour
      </a>
    </nav>
  </div>
</header>


      {/* Contenu principal */}
      <main className="flex-grow container mx-auto px-4 py-8">
  <div className="flex flex-col md:flex-row">
    {/* Colonne de gauche : Génération des exercices */}
    <div className="md:w-2/3">
      <h1 className="text-4xl font-bold mb-6">Générer des Exercices</h1>
      {/* Sélection du domaine */}
      <div className="mb-4">
        <label className="block font-bold mb-2">Sélectionnez un domaine :</label>
        <select
          className="p-2 border rounded bg-[rgba(255,255,255,0.6)]"
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
          {domains.map((domain: Domain) => (
            <option key={domain.name} value={domain.name}>
              {domain.name}
            </option>
          ))}
        </select>
      </div>
      {/* Sélection du chapitre */}
      {selectedDomain && (
        <div className="mb-4">
          <label className="block font-bold mb-2">Sélectionnez un chapitre :</label>
          <select
            className="p-2 border rounded bg-[rgba(255,255,255,0.6)]"
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
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        {isLoading ? "Génération en cours..." : "Générer l'exercice"}
      </button>
      {/* Affichage de l'exercice généré */}
      {generatedExercise && (
        <div className="mt-6 p-4 border rounded bg-white/80">
          <h2 className="text-2xl font-bold mb-2">Exercice généré</h2>
          <ReactMarkdown>{generatedExercise}</ReactMarkdown>
          {(generatedExercise.toLowerCase().includes("geometryboard") ||
            generatedExercise.toLowerCase().includes("affichage interactif")) && (
            <div className="mt-4">
              <GeometryBoard />
            </div>
          )}
          {/* Zone de réponse */}
          <div className="mt-4">
            <label className="block font-bold mb-2">Votre réponse :</label>
            <textarea
              className="w-full p-2 border rounded h-40"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isAnswerSubmitted}
            />
            <button
              onClick={handleSubmitAnswer}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              disabled={isAnswerSubmitted || checkingAnswer}
            >
              {checkingAnswer ? "Vérification en cours..." : "Soumettre"}
            </button>
          </div>
          {/* Feedback */}
          {feedback && (
            <div className="mt-4 p-2 border rounded">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Colonne de droite : Zone des outils */}
    <div className="md:w-1/3 md:pl-4 mt-8 md:mt-0">
      {/* Ici, placez l'outil calculatrice */}
      <button onClick={() => setShowCalculator(true)} className="p-2 hover:opacity-80">
        <img src="/calculatrice.png" alt="Calculatrice" className="w-15 h-15" />
      </button>
    </div>
  </div>
</main>


      {/* Footer */}
      <footer className="p-4 text-center bg-gray-100">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>

      {/* Affichage de la calculatrice scientifique */}
      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}
    </div>
  );
}
