import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentRequest,
} from "@google/generative-ai";
import { db } from "../../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { storeOrIncrementScore } from "../../lib/storeOrIncrementScore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message = "", mode, conversationHistory, quiz, studentAnswers, game, userAnswer, userClass, userId, exerciseId } = body;

    // Détection d'un document partagé dans le message ou dans l'historique
    let filePrompt = "";
    const fileRegex = /Document partagé:\s*\[(.*?)\]\((.*?)\)/;
    let fileMatch = message.match(fileRegex);
    if (!fileMatch && conversationHistory) {
      fileMatch = conversationHistory.match(fileRegex);
    }
    if (fileMatch) {
      // fileMatch[1] contient le nom du fichier, fileMatch[2] l'URL
      filePrompt = `\nLe document partagé par l'élève (${fileMatch[1]}) est accessible ici : ${fileMatch[2]}. Prends ce document en compte dans ta réponse.`;
    }

    if (mode === "cours_anglais") {
      let prenom = "l'élève"; // valeur par défaut

      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as { prenom?: string };
          prenom = userData.prenom ?? "l'élève";
        }
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Tu es un professeur d'anglais exceptionnel pour ${prenom}, un élève de classe de ${userClass}ème. Ton approche pédagogique consiste à proposer des exercices et des explications structurés en fonction de ses attentes.
exemple: Si il te dit "je veux un cours sur les verbes irreguliers", à toi de proposer un contenu et des exercices appropriés. Si il te dit "je veux réviser le prétérit", à toi de lui expliquer la leçon et de proposer des exercices en rapport. Enchaîne les questions sans aucune phrase inutile.
Tu dois maintenir un humour subtil et encourager l'élève. À chaque bonne réponse, tu diras clairement dans le message "1 point !" Lorsque ${prenom} fait une erreur, ton objectif est de le guider vers la bonne réponse sans la lui donner directement, mais en lui posant des questions ou en lui expliquant ses erreurs de manière claire et constructive.
**Énoncé textuel** : Présente l'exercice sous forme de texte formaté en Markdown (titres, listes à puces, gras, etc.)
${
  conversationHistory && conversationHistory.trim() !== ""
    ? `Tu te souviens de notre conversation précédente :
${conversationHistory}`
    : ""
}
${filePrompt}
Maintenant, voici la dernière question de ${prenom} : "${message}". Aide ${prenom} dans son apprentissage en utilisant entre 20 et 50 mots maximum, rédigés en français et en anglais. Incorpore un ou deux emojis maximum pour rendre l'échange agréable. N'oublie pas que ${prenom} est en ${userClass}ème.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json({ response: text });
    }

    if (mode === "help") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = conversationHistory && conversationHistory.trim() !== ""
        ? `Tu es un professeur d'anglais pédagogique exceptionnel, drôle et encourageant. Tu te souviens de la conversation précédente :
${conversationHistory}
${filePrompt}
Maintenant, voici la dernière question de l'élève : "${message}". Donne-lui une réponse concise (pas plus de 30 mots) rédigée en français et anglais.`
        : `Tu es un professeur d'anglais pédagogique exceptionnel, drôle et encourageant. Voici la question de l'élève : "${message}".
Réponds avec des emoji pour plus de gaité. ${filePrompt}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json({ response: text });
    }

    if (mode === "quiz") {
      const baseClass = parseInt(userClass, 10);
      const exponentFactor = 1.5;
      const wordCount = Math.round(20 * Math.exp((6 - baseClass) / exponentFactor));
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
      // Étape 1 : Générer une liste de mots en anglais
      const promptList = `
    Tu es un professeur d'anglais pour des collégiens de ${userClass}ème.
    L'élève a choisi le thème suivant pour son quiz d'anglais : "${message}".
    Propose une liste de mots contenant entre ${wordCount} et ${wordCount * 2} mots adaptés au thème "${message}" et à la classe de ${userClass}ème.
    Écris uniquement la liste des mots, séparés par des virgules.
      `;
    
      const listResult = await model.generateContent(promptList);
      let listText = listResult.response.text();
      if (listText.trim().startsWith("```")) {
        listText = listText.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "").trim();
      }
      console.log("Liste de mots générés :", listText);
      // Extraction du tableau de mots
      const wordList = listText.split(",").map(w => w.trim()).filter(w => w);
    
      // Sélection aléatoire de 3 mots
      let selectedWords: string[] = [];
      if (wordList.length <= 3) {
        selectedWords = wordList;
      } else {
        const indices = new Set<number>();
        while (indices.size < 3) {
          indices.add(Math.floor(Math.random() * wordList.length));
        }
        selectedWords = Array.from(indices).map(i => wordList[i]);
      }
    
      // Étape 2 : Générer le quiz en utilisant ces 3 mots
      const promptFinal = `
    Tu es un professeur d'anglais pour des collégiens de ${userClass}ème.
    L'élève a choisi le thème suivant pour son quiz d'anglais : "${message}".
    Utilise les mots suivants pour créer un quiz de 3 questions : ${selectedWords.join(", ")}.
    Pour chaque question, propose 4 options.
    Assure-toi que les questions testent la compréhension des mots et du thème.
    Réponds en JSON formaté exactement comme ceci :
    {
      "questions": [
        {
          "question": "**Texte de la question en anglais**",
          "Traduction": "**Traduction de la question en français**",
          "options": ["Option A", "Option B", "Option C", "Option D"]
        },
        {
          "question": "**Texte de la question en anglais**",
          "Traduction": "**Traduction de la question en français**",
          "options": ["Option A", "Option B", "Option C", "Option D"]
        },
        {
          "question": "**Texte de la question en anglais**",
          "Traduction": "**Traduction de la question en français**",
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ]
    }
      `;
    
      const finalResult = await model.generateContent(promptFinal);
      let text = finalResult.response.text();
      if (text.trim().startsWith("```")) {
        text = text.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "").trim();
      }
      return NextResponse.json({ response: text });
    }
    

    if (mode === "game") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `Tu es un expert en développement de jeux éducatifs en anglais. Crée un jeu interactif pour aider un élève à pratiquer son anglais. Voici le thème/consigne : "${message}". Décris brièvement le jeu, les règles et en quoi il aide l'élève. Réponds de façon concise.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json({ response: text });
    }

    if (mode === "checkQuiz") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `
    Voici le quiz généré :
    ${quiz}
    
    Les réponses de l'élève sont :
    ${JSON.stringify(studentAnswers, null, 2)}
    
    IMPORTANT : Merci d'attribuer une note sur 3 à la performance de l'élève (format "Note : X/3").
    La note doit être un entier (0,1,2 ou 3).
    
    Ensuite, rédige un feedback détaillé en français pour chaque question.
    Indique clairement si la réponse est correcte ou non, et pour une réponse incorrecte, donne la bonne réponse.
    Rédige ta réponse sous forme d'un texte naturel, sans utiliser de format JSON.
    `;
      
      const result = await model.generateContent(prompt as unknown as GenerateContentRequest);
      // Vérifie que result.response.text() retourne bien une chaîne, sinon on utilise ""
      const text = result.response?.text() || "";
      console.log("Réponse complète Gemini:", text);
      
      const noteRegex = /Note\s*:\s*(\d)\/3/;
      const noteMatch = text ? text.match(noteRegex) : null;
      let note = null;
      if (noteMatch && noteMatch[1]) {
        note = parseInt(noteMatch[1], 10);
      } else {
        console.log("Impossible de trouver la note dans la réponse.");
      }
      
      let feedback = text;
      if (noteMatch) {
        const endOfNoteIndex = noteMatch.index! + noteMatch[0].length;
        feedback = text.substring(endOfNoteIndex).trim();
      }
      
      console.log("Note extraite:", note);
      console.log("Feedback extrait:", feedback);
      
      if (userId && note !== null) {
        await storeOrIncrementScore(db, userId, exerciseId, note);
      }
      
      return NextResponse.json({ response: text, note, feedback });
    }
    

    if (mode === "orderWords") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `
L'élève de classe ${userClass}ème a choisi le thème suivant pour un exercice de réordonnancement des mots en anglais : "${message}".
Crée une phrase simple et courte en anglais sur ce thème, puis mélange les mots de manière aléatoire pour que l'élève puisse les remettre dans l'ordre.
**Réponds en utilisant le format Markdown** avec une présentation claire :
- un titre,
- la phrase mélangée sous forme de liste ou dans un encadré,
- la consigne pour l’élève,
- un saut de ligne,
Exemple de format attendu :
**Phrase mélangée** : \`the - cat - on - sat - mat - the\`
`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      if (text.trim().startsWith("```")) {
        text = text
          .replace(/^```(json)?\s*/, "")
          .replace(/\s*```$/, "")
          .trim();
      }
      return NextResponse.json({ response: text });
    }

    if (mode === "checkOrderWords") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `
Voici un exercice de réordonnancement des mots destiné à un élève de classe ${userClass}.
    
Consigne :
${game}
    
Réponse de l'élève : "${userAnswer}"
    
1. Analyse la réponse de l'élève.
2. Si la réponse est exactement correcte, félicite-le chaleureusement.
3. Sinon, indique la phrase correcte attendue et explique en français ce qui ne va pas (ordre, orthographe, mots manquants).
4. Termine la réponse avec : "#BONNE_REPONSE#" **uniquement si la réponse est correcte**, sinon ne mets rien.
    
Réponds en français, de manière amicale et encourageante.
Utilise le Markdown pour structurer la réponse (gras, titres, listes si besoin).
`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
    
      return NextResponse.json({ response: text });
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
