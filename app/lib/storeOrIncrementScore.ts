// utils/storeOrIncrementScore.ts

import { Firestore, doc, updateDoc, setDoc, increment } from "firebase/firestore";

/**
 * Incrémente le champ note dans Firestore et stocke le feedback.
 * - Si le doc "users/{userId}" n'existe pas encore, on le crée avec la note initiale.
 * @param db Instance Firestore
 * @param userId ID de l'utilisateur (obligatoire)
 * @param exerciseId Identifiant d'exercice (facultatif). S'il est présent, on stocke sous note_<exId>, feedback_<exId>
 * @param note Valeur à incrémenter
 * @param feedback Feedback texte
 */
export async function storeOrIncrementScore(
  db: Firestore,
  userId: string,
  exerciseId: string | null | undefined,
  note: number,
  
) {
  if (!userId || note == null) return;

  // doc dans la collection "users"
  const userRef = doc(db, "users", userId);

  // Détermine le champ : note_ex01, note_chat, note (par défaut)
  const fieldNote = exerciseId ? `note_${exerciseId}` : "note";
  

  try {
    // On incrémente la note (sous ce champ) et on met à jour le feedback
    await updateDoc(userRef, {
      [fieldNote]: increment(note),
      
    });
    
  } catch (error: any) {
    if (error.code === "not-found") {
      // Si le doc n'existe pas, on le crée
      await setDoc(
        userRef,
        {
          [fieldNote]: note,
          
        },
        { merge: true }
      );
      console.log(
        `Document créé pour userId=${userId}: note=${note}, feedback stocké.`
      );
    } else {
      // Autre erreur => on la relance
      throw error;
    }
  }
}
