import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

// Initialisation de Firebase Admin (à faire une seule fois)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS!)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export async function POST(request: Request) {
  try {
    // Extraction du fichier depuis le FormData de la requête
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Convertir le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Obtenir le bucket de Firebase Storage
    const bucket = getStorage().bucket();

    // Générer un nom unique pour le fichier
    const fileName = `uploads/${uuidv4()}_${file.name}`;
    const fileUpload = bucket.file(fileName);

    // Sauvegarder le fichier dans le bucket
    await fileUpload.save(fileBuffer, {
      metadata: { contentType: file.type },
    });

    // Générer l'URL publique (assurez-vous que votre bucket autorise l'accès public ou utilisez un URL signé)
    const fileUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}
