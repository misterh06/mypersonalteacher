import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

// Initialisation de Firebase Admin (à faire une seule fois)
if (!getApps().length) {
  try {
    const credentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!credentials || !storageBucket) {
      console.warn("Firebase credentials or storage bucket not available");
      if (process.env.NODE_ENV === "development") {
        console.log("Skipping Firebase initialization in development mode");
      } else {
        console.error("Firebase configuration is required in production");
      }
    } else {
      try {
        const parsedCredentials = JSON.parse(credentials);
        initializeApp({
          credential: cert(parsedCredentials),
          storageBucket: storageBucket,
        });
        console.log("Firebase Admin initialized successfully");
      } catch (parseError) {
        console.error("Error parsing Firebase credentials:", parseError);
        if (process.env.NODE_ENV === "production") {
          throw new Error("Invalid Firebase credentials format");
        }
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    } else {
      console.log("Continuing without Firebase Admin in development mode");
    }
  }
}

export async function POST(request: Request) {
  try {
    // Vérifier si Firebase Admin est initialisé
    if (!getApps().length) {
      if (process.env.NODE_ENV === "development") {
        // En développement, simuler une réponse réussie
        return NextResponse.json({ 
          url: `https://example.com/mock-upload/${Date.now()}`
        });
      }
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

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

    // Générer l'URL publique
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
