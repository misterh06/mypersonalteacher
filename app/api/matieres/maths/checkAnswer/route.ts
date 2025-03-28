// app/api/checkAnswer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

function buildPrompt(exercise: string, userAnswer: string, userClass: string) {
  return `
Tu es un professeur de mathématiques évaluant la réponse d'un élève de ${userClass}ème.

Voici l'exercice :
${exercise}

Réponse de l'élève :
${userAnswer}

Ton objectif est d'évaluer la réponse de l'élève et de fournir :
1. Une analyse détaillée de la réponse
2. Un feedback constructif et encourageant
3. Une note sur 10 points
4. Une indication claire si la réponse est correcte (true) ou incorrecte (false)

Format de réponse attendu (en JSON) :
{
  "feedback": "Ton analyse détaillée ici...",
  "points": nombre de points sur 10,
  "isCorrect": true/false
}

Sois encourageant même en cas d'erreur. Explique toujours comment s'améliorer.
`;
}

export async function POST(request: NextRequest) {
  try {
    const { exercise, userAnswer, userClass } = await request.json();
    const prompt = buildPrompt(exercise, userAnswer, userClass);

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    const response = await result.response;
    const responseText = response.text();
    
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Format de réponse invalide");
      }
      const evaluation = JSON.parse(jsonMatch[0]);
      
      return NextResponse.json(evaluation);
    } catch (parseError) {
      // Si le parsing JSON échoue, renvoyer le texte brut avec des valeurs par défaut
      return NextResponse.json({
        feedback: responseText,
        points: 0,
        isCorrect: false
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la réponse :", error);
    return NextResponse.json(
      { 
        feedback: "Une erreur est survenue lors de la vérification de la réponse.",
        points: 0,
        isCorrect: false
      },
      { status: 500 }
    );
  }
}
