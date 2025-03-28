import { NextResponse } from "next/server";
import { GoogleGenerativeAI, GenerateContentRequest } from "@google/generative-ai";
import { db } from "../../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { storeOrIncrementScore } from "../../lib/storeOrIncrementScore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, mode, userAnswer, userClass, userId, exerciseId, direction } = body;

    if (mode === "translate") {
      const baseClass = parseInt(userClass, 10);
      const exponentFactor = 1.5;
      const wordCount = Math.round(10 * Math.exp((6 - baseClass) / exponentFactor));

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Étape 1 : Générer une liste de mots
      const promptList = `
Tu es un professeur d'anglais pour des collégiens de ${userClass}ème.
L'élève a choisi le thème suivant : "${message}".
${direction === "en-fr" ? "Les mots générés doivent être en anglais." : "Les mots générés doivent être en français."}
Propose une liste de mots contenant entre ${wordCount} et ${wordCount * 2} mots adaptés au thème "${message}" et à la classe de ${userClass}ème.
Écris uniquement la liste des mots, séparés par des virgules.
`;


      const listResult = await model.generateContent(promptList);
      const listText = listResult.response.text();

      // Extraction des mots et sélection aléatoire
      const wordList = listText.split(",").map(w => w.trim()).filter(w => w);
      const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

      // Étape 2 : Générer le prompt final
      const promptFinal = `Voici le mot à traduire : ${randomWord}`;

      return NextResponse.json({ response: promptFinal });
    }

    if (mode === "checktranslate") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `Tu es un professeur d'anglais expérimenté. Voici un exercice de traduction destiné à un élève de classe ${userClass}ème :
Exercice : "${message}"
Réponse attendue : (fournie par le système)
Réponse de l'élève : "${userAnswer}"

Attribue une note sur 1 à la performance de l'élève au format "Note : X/1" (où X vaut 1 si la traduction est correcte, sinon 0).
Fais une explication brève (10 mots) avec correction si nécessaire. Utilise le Markdown pour structurer ta réponse (titres, listes, gras, etc.).`;

      const result = await model.generateContent(prompt as unknown as GenerateContentRequest);
      let text = result.response.text();

      const noteRegex = /Note\s*:\s*(\d)\/1/;
      const noteMatch = text.match(noteRegex);
      let note = null;
      if (noteMatch && noteMatch[1]) {
        note = parseInt(noteMatch[1], 10);
      } else {
        console.log("Impossible de trouver la note dans la réponse de translate.");
      }

      let feedback = text;
      if (noteMatch) {
        const endOfNoteIndex = noteMatch.index! + noteMatch[0].length;
        feedback = text.substring(endOfNoteIndex).trim();
      }

      if (userId && note !== null) {
        await storeOrIncrementScore(db, userId, exerciseId, note);
      }

      return NextResponse.json({ response: text, note, feedback });
    }

    return NextResponse.json({ response: "Mode non reconnu." });
  } catch (error) {
    console.error("Erreur API Gemini:", error);
    return NextResponse.json(
      { response: "Désolé, une erreur est survenue avec Gemini." },
      { status: 500 }
    );
  }
}