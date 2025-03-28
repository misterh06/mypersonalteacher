// app/api/checkAnswer/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerateContentRequest } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);



export async function POST(request: Request) {
  try {
    const { exercise, userAnswer, userClass, geometry } = await request.json();
    
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


const prompt = `
Tu es un professeur de mathématiques pour des élèves de niveau ${userClass}ème.
Voici un exercice : "${exercise}".
Voici la réponse textuelle de l'élève : "${userAnswer}".
${geometry ? `Voici les données géométriques fournies par l'élève : ${JSON.stringify(geometry)}.` : ""}
Tu parleras sur un ton jovial, positif, amusant et avec des emoji.
Dis-moi si la réponse (textuelle et géométrique) est correcte, presque correcte ou non.
Si elle est fausse, explique pourquoi et donne la bonne solution.
Réponds de manière concise et claire.
`;

    const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    } as GenerateContentRequest);

    const response = await result.response;
    const feedback = response.text();

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Erreur lors de la vérification de la réponse :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification de la réponse." },
      { status: 500 }
    );
  }
}
