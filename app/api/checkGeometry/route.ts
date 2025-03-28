import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { exercise, geometry, userClass } = await req.json();

    // Préparation du prompt pour Gemini
    const prompt = `
En tant qu'expert en géométrie, analysez la construction géométrique suivante et fournissez un retour constructif.

Exercice demandé : ${exercise}

Construction de l'élève :
${JSON.stringify(geometry, null, 2)}

Instructions spécifiques pour l'analyse :
1. Vérifiez si l'élève a correctement construit :
   - L'angle de 30° pour la question 1
   - L'angle de 60° pour la question 2
   - L'utilisation correcte du rapporteur

2. Évaluez la précision des constructions :
   - La précision des angles (tolérance de ±2°)
   - La clarté des constructions
   - L'utilisation appropriée des outils

3. Fournissez un retour pédagogique :
   - Des encouragements pour les points positifs
   - Des suggestions concrètes d'amélioration
   - Des rappels des concepts clés si nécessaire

Format de réponse souhaité :
- Analyse : [description détaillée des constructions]
- Précision : [évaluation de la précision des angles]
- Suggestions : [liste des améliorations possibles]
- Note : [note/10] - [justification]
- Message d'encouragement : [message motivant]
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Erreur lors de la vérification de la géométrie :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification" },
      { status: 500 }
    );
  }
} 