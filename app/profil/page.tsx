//app/profil/

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    nom: "",
    prenom: "",
    classe: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged user:", user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Profil existant:", docSnap.data());
          setProfile(docSnap.data() as any);
        } else {
          console.log("Aucun document de profil trouvé pour cet utilisateur.");
        }
      } else {
        console.log("Aucun utilisateur connecté, redirection vers /login");
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);
  
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (auth.currentUser) {
      // Sauvegarder les données de profil dans Firestore
      await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
      alert("Profil mis à jour !");
    }
  };

  if (loading) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header global */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">My Personal Teacher</div>
          <nav className="space-x-4">
            <Link href="/">Accueil</Link>
            
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Mon Profil</h1>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="mb-4">
            <label className="block mb-1 font-bold" htmlFor="nom">
              Nom
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={profile.nom}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Votre nom"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-bold" htmlFor="prenom">
              Prénom
            </label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={profile.prenom}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Votre prénom"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-bold" htmlFor="classe">
              Classe
            </label>
            <select
              id="classe"
              name="classe"
              value={profile.classe}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Sélectionnez votre classe --</option>
              <option value="3">3ème</option>
              <option value="4">4ème</option>
              <option value="5">5ème</option>
              <option value="6">6ème</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Enregistrer
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
