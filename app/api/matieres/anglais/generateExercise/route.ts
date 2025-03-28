import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentRequest,
} from "@google/generative-ai";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseConfig";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});


function buildPrompt(domain: string, chapter: string, userClass: string, prenom: string) {
  return `
Tu es un professeur d'anglais pour un élève de ${userClass}ème.
Domaine : ${domain}
Chapitre : ${chapter}
Son prénom est: ${prenom}
Ton objectif est de générer un énoncé d'exercice d'anglais clair et concis, adapté au niveau ${userClass}ème, en francais.
L'exercice  dois faire entre 50 et 150 mots et porter sur ${domain} et ${chapter}


1. **Enoncé textuel** : Présente l'exercice sous forme de texte formaté en Markdown (titres, listes à puces, gras, etc.) afin d'expliquer clairement la consigne à l'élève.

Porte une attention particulière sur le niveau de l'élève, à savoir: ${userClass}ème, l'exercice ne doit pas être trop compliqué pour ne pas décourager l'élève.

Adopte un ton jovial, positif, amusant et ajoute quelques emoji pour rendre la réponse engageante.




  `;
}

export async function POST(request: NextRequest) {
  try {
    const { domain, chapter, userClass, userId } = await request.json();
    console.log("🔑 userId reçu dans generateExercise:", userId);

    let prenom = "l'élève";
    if (userId) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as { prenom?: string };
        prenom = userData.prenom ?? prenom;
      }
    }
    const prompt = buildPrompt(domain, chapter, userClass, prenom);
    console.log("🧠 Prénom utilisé dans le prompt :", prenom);


    const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    } as GenerateContentRequest);

    const response = await result.response;
    const generatedText = response.text();
    console.log("Réponse générée :", generatedText);
    return NextResponse.json({ exercise: generatedText });
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération de l'exercice." },
      { status: 500 }
    );
  }
}
