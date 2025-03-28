// app/api/matieres/anglais/checkAnswer/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentRequest,
} from "@google/generative-ai";
import { db } from "../../../../lib/firebaseConfig";

import { storeOrIncrementScore } from "../../../../lib/storeOrIncrementScore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ...
  ],
});

function buildPrompt(exercise: string, userAnswer: string, userClass: string) {
  return `
"Tu es un super professeur d'anglais pour des élèves de ${userClass}ème.
Exercice : ${exercise}
Réponse de l'élève : ${userAnswer}.

IMPORTANT : Merci d'attribuer une note sur 10 à la réponse de l'élève.
La note doit être un nombre entier entre 0 et 10, au format : "Note : X/10".

Tu commenceras par donner sa note à l'éleve.

Ensuite, tu lui donneras la correction et lui fourniras un feedback constructif et amical.
Réponds en français avec un peu d'anglais, et sois positif!"
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { exercise, userAnswer, userClass, userId, exerciseId } = await request.json();
    console.log("userId:", userId, "exerciseId:", exerciseId);

    const prompt = buildPrompt(exercise, userAnswer, userClass);
    const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    } as GenerateContentRequest);

    // Conversion de la réponse
    const response = await result.response;
    const fullResponse = response.text();
    console.log("Full Response from Gemini:", fullResponse);

    // Extraction de la note
    const noteRegex = /Note\s*:\s*(\d)\/10/;
    const noteMatch = fullResponse.match(noteRegex);
    let note = null;
    if (noteMatch && noteMatch[1]) {
      note = parseInt(noteMatch[1], 10);
    } else {
      console.log("No note found in Gemini's response.");
    }

    // Reste du texte comme feedback
    let feedback = "";
    if (noteMatch) {
      feedback = fullResponse.substring(noteMatch.index! + noteMatch[0].length).trim();
    } else {
      feedback = fullResponse.trim();
    }

    console.log("Extracted Feedback:", feedback);
    console.log("Extracted Note:", note);

    // Stockage dans Firestore
    if (userId && note !== null) {
      // Appel de la fonction utilitaire, qui gère doc inexistant + update + increment
      await storeOrIncrementScore(db, userId, exerciseId, note);
    }

    return NextResponse.json({ feedback, note });
  } catch (error) {
    console.error("Error calling Gemini or updating Firestore:", error);
    return NextResponse.json({ error: "An error occurred while checking the answer." }, { status: 500 });
  }
}
