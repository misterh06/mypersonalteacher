// app/api/maths/generateExercise/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  Part,
  GenerateContentRequest,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

function buildPrompt(domain: string, chapter: string, userClass: string) {
  return `
Tu es un assistant pédagogique spécialisé en mathématiques pour des élèves de niveau ${userClass}ème.
Domaine : ${domain}
Chapitre : ${chapter}

Ton objectif est de générer un énoncé d'exercice clair et concis, adapté au niveau ${userClass}ème, en français. L'exercice doit comporter deux parties :

1. **Enoncé textuel** : Présente l'exercice sous forme de texte formaté en Markdown (utilise des titres, des listes à puces, du gras, etc.) afin d'expliquer clairement la consigne à l'élève.

2. **Affichage interactif** : Si l'exercice porte sur des figures géométriques (carré, cercle, triangle, etc.), indique explicitement que l'application doit afficher une figure interactive. Par exemple, écris "Affiche la figure interactive suivante : géométrie" ou "Utilise le composant GeometryBoard pour afficher la géométrie interactive".

Adopte un ton jovial, positif, amusant et ajoute quelques emoji pour rendre la réponse engageante.

Affiche en premier dans ta réponse : \`${userClass}ème, ${domain}, ${chapter}\`.

Réponds en français.
  `;
}


export async function POST(request: NextRequest) {
  try {
    const { domain, chapter, userClass } = await request.json();
    const prompt = buildPrompt(domain, chapter, userClass);

    // Correction : Utiliser GenerateContentRequest
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
