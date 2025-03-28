//app/

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { auth, db } from "./lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";

 // Fonction pour calculer la distribution de médailles
 function getMedalsDistribution(points: number) {
   let bronze = Math.floor(points / 50); // 1 médaille de bronze par palier de 50 points
   let silver = 0;
   let gold = 0;
 
   // Conversion bronze -> silver (5 bronze = 1 silver)
   if (bronze >= 5) {
     silver = Math.floor(bronze / 5);
     bronze = bronze % 5;
   }
 
   // Conversion silver -> gold (5 silver = 1 gold)
   if (silver >= 5) {
     gold = Math.floor(silver / 5);
     silver = silver % 5;
   }
 
   return { gold, silver, bronze };
 }

export default function Home() {
  const [userProfile, setUserProfile] = useState<{ nom: string; prenom: string } | null>(null);
  const [noteEx01, setNoteEx01] = useState<number>(0);
  const [totalAnglais, setTotalAnglais] = useState<number>(0);
  const [totalFrancais, setTotalFrancais] = useState<number>(0);
  const [totalMaths, setTotalMaths] = useState<number>(0);
  const [eleves, setEleves] = useState<{
    anglais: Array<{
      nom: string;
      prenom: string;
      pointsAnglais: number;
      pointsFrancais: number;
      pointsMaths: number;
      goldAnglais: number;
      silverAnglais: number;
      bronzeAnglais: number;
      goldFrancais: number;
      silverFrancais: number;
      bronzeFrancais: number;
      goldMaths: number;
      silverMaths: number;
      bronzeMaths: number;
    }>;
    francais: Array<{
      nom: string;
      prenom: string;
      pointsAnglais: number;
      pointsFrancais: number;
      pointsMaths: number;
      goldAnglais: number;
      silverAnglais: number;
      bronzeAnglais: number;
      goldFrancais: number;
      silverFrancais: number;
      bronzeFrancais: number;
      goldMaths: number;
      silverMaths: number;
      bronzeMaths: number;
    }>;
    maths: Array<{
      nom: string;
      prenom: string;
      pointsAnglais: number;
      pointsFrancais: number;
      pointsMaths: number;
      goldAnglais: number;
      silverAnglais: number;
      bronzeAnglais: number;
      goldFrancais: number;
      silverFrancais: number;
      bronzeFrancais: number;
      goldMaths: number;
      silverMaths: number;
      bronzeMaths: number;
    }>;
  }>({
    anglais: [],
    francais: [],
    maths: []
  });

  useEffect(() => {
    const fetchEleves = async () => {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const elevesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let pointsAnglais = 0;
        let pointsFrancais = 0;
        let pointsMaths = 0;

        // Calcul des points par matière
        for (const [key, value] of Object.entries(data)) {
          if (key === "notes" && typeof value === "object") {
            // Points d'anglais (somme de tous les sous-points)
            const anglaisNotes = value.anglais || {};
            pointsAnglais = (anglaisNotes.exercices || 0) + 
                          (anglaisNotes.jeux?.translate || 0) + 
                          (anglaisNotes.jeux?.orderwords || 0) +
                          (anglaisNotes.jeux?.irregular_verbs || 0) +
                          (anglaisNotes.jeux?.quiz || 0);
            
            pointsFrancais = value.francais || 0;
            pointsMaths = value.maths || 0;
            break;
          }
        }

        // Log des points totaux
        console.log(`Points totaux pour ${data.prenom}:`, {
          anglais: pointsAnglais,
          francais: pointsFrancais,
          maths: pointsMaths
        });

        // Calcul des médailles par matière
        const medalsAnglais = getMedalsDistribution(pointsAnglais);
        const medalsFrancais = getMedalsDistribution(pointsFrancais);
        const medalsMaths = getMedalsDistribution(pointsMaths);

        return {
          nom: data.nom || "",
          prenom: data.prenom || "",
          pointsAnglais,
          pointsFrancais,
          pointsMaths,
          goldAnglais: medalsAnglais.gold,
          silverAnglais: medalsAnglais.silver,
          bronzeAnglais: medalsAnglais.bronze,
          goldFrancais: medalsFrancais.gold,
          silverFrancais: medalsFrancais.silver,
          bronzeFrancais: medalsFrancais.bronze,
          goldMaths: medalsMaths.gold,
          silverMaths: medalsMaths.silver,
          bronzeMaths: medalsMaths.bronze
        };
      });

      // Trier par matière
      const elevesAnglais = [...elevesData].sort((a, b) => b.pointsAnglais - a.pointsAnglais);
      const elevesFrancais = [...elevesData].sort((a, b) => b.pointsFrancais - a.pointsFrancais);
      const elevesMaths = [...elevesData].sort((a, b) => b.pointsMaths - a.pointsMaths);

      // Log du classement final
      console.log("Classement Anglais:", elevesAnglais.map(e => `${e.prenom}: ${e.pointsAnglais} pts`));

      setEleves({
        anglais: elevesAnglais,
        francais: elevesFrancais,
        maths: elevesMaths
      });
    };

    fetchEleves();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
  
          let total = 0;
          if (docData.notes) {
            // Calcul du total des points d'anglais
            const anglaisNotes = docData.notes.anglais || {};
            const pointsAnglais = (anglaisNotes.exercices || 0) + 
                                (anglaisNotes.jeux?.translate || 0) + 
                                (anglaisNotes.jeux?.orderwords || 0) +
                                (anglaisNotes.jeux?.irregular_verbs || 0) +
                                (anglaisNotes.jeux?.quiz || 0);
            
            // Calcul des totaux par matière
            setTotalAnglais(pointsAnglais);
            setTotalFrancais(docData.notes.francais || 0);
            setTotalMaths(docData.notes.maths || 0);
            
            // Calcul du total général
            const totalGeneral = pointsAnglais + 
                               (docData.notes.francais || 0) + 
                               (docData.notes.maths || 0);
            setNoteEx01(totalGeneral);
          }
  
          setUserProfile({
            nom: docData.nom || "",
            prenom: docData.prenom || "",
          });
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  const { gold, silver, bronze } = getMedalsDistribution(noteEx01);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header global */}
      <header className="shadow" style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {userProfile && (
              <span className="text-2xl font-bold">
                {userProfile.prenom} {userProfile.nom}
              </span>
            )}
            
         {/* On regroupe médailles + points dans un conteneur */}
         <div className="flex items-center ml-20">
         <img
                 src="/pop.png"
                 alt="pop"
                 className="w-38 h-18 mr-0"
               />
             {/* Médailles d'or */}
             {Array.from({ length: gold }).map((_, i) => (
               <img
                 key={`gold-${i}`}
                 src="/gold.png"
                 alt="Médaille d'or"
                 className="w-13 h-13 mr-2"
               />
             ))}
             {/* Médailles d'argent */}
             {Array.from({ length: silver }).map((_, i) => (
               <img
                 key={`silver-${i}`}
                 src="/silver.png"
                 alt="Médaille d'argent"
                 className="w-13 h-13 mr-2"
               />
             ))}
             {/* Médailles de bronze */}
             {Array.from({ length: bronze }).map((_, i) => (
               <img
                 key={`bronze-${i}`}
                 src="/bronze.png"
                 alt="Médaille de bronze"
                 className="w-13 h-13 mr-2"
               />
             ))}
             <div className="flex items-center ml-3">
              {/* Total général */}
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded shadow mr-4">
                {noteEx01} pts
              </div>
              {/* Totaux par matière */}
              <div className="flex space-x-2">
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded shadow">
                  {totalAnglais} pts
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded shadow">
                  {totalFrancais} pts
                </div>
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded shadow">
                  {totalMaths} pts
                </div>
              </div>
            </div>
           </div>  
          </div>
          <nav className="space-x-4">
            <Link href="/profil">Profil</Link>
            <Link
              href="/login"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Section Héro avec l'image accueil.png en fond */}
        <section
          className="text-center p-8 rounded-md"
          style={{
            backgroundImage: "url('/accueil.png')",
            backgroundSize: "cover",
            backgroundPosition: "50% calc(55% - 20px)",
            backgroundRepeat: "no-repeat",
            height: "120px",
          }}
        >
          <div className="flex flex-col justify-center items-center h-full">
            <h1
              className="text-4xl font-bold text-white"
              style={{ textShadow: "3px 3px 1px rgba(0, 0, 0, 0.6)" }}
            >
              Bienvenue sur ton espace pédagogique 🚀
            </h1>
            <p
              className="mt-4 text-lg text-white"
              style={{ lineHeight: "0", textShadow: "3px 3px 1px rgba(0, 0, 0, 0.6)" }}
            >
              Explore nos cours et outils interactifs pour apprendre autrement.
            </p>
          </div>
        </section>

        {/* Section Matières avec image style.png en fond et boutons sous forme de cartes */}
        <section
          className="relative p-8 my-8 rounded-md"
          style={{
            backgroundImage: "url('/style.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "800px", // Augmenté pour accommoder les deux sections
          }}
        >
          {/* Overlay pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-black opacity-40"></div>
          
          {/* Première rangée : Cartes des matières */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <Link
                href="/matieres/anglais/exercices"
                className="block bg-purple-400 text-white p-6 rounded-lg shadow-lg hover:bg-purple-600 transition"
              >
                <h2 className="text-2xl font-bold">Anglais</h2>
                <p>Améliore ta compréhension et ta communication.</p>
              </Link>
              {/* Classement Anglais */}
              <div className="bg-yellow-100/90 backdrop-blur-sm p-6 rounded-lg shadow-lg mt-4">
                <h3 className="text-xl font-bold mb-4">Classement</h3>
                {eleves.anglais?.slice(0, 5).map((eleve, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{index + 1}. {eleve.prenom} {eleve.nom}</span>
                    <div className="flex items-center">
                      <span className="mr-2">{eleve.pointsAnglais} pts</span>
                      {eleve.goldAnglais > 0 && <img src="/gold.png" alt="Or" className="w-5 h-5 mr-1" />}
                      {eleve.silverAnglais > 0 && <img src="/silver.png" alt="Argent" className="w-5 h-5 mr-1" />}
                      {eleve.bronzeAnglais > 0 && <img src="/bronze.png" alt="Bronze" className="w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/matieres/francais"
                className="block bg-green-400 text-white p-6 rounded-lg shadow-lg hover:bg-green-600 transition"
              >
                <h2 className="text-2xl font-bold">Français</h2>
                <p>Approfondis ta maîtrise de la langue française.</p>
              </Link>
              {/* Classement Français */}
              <div className="bg-blue-100/90 backdrop-blur-sm p-6 rounded-lg shadow-lg mt-4">
                <h3 className="text-xl font-bold mb-4">Classement</h3>
                {eleves.francais?.slice(0, 5).map((eleve, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{index + 1}. {eleve.prenom} {eleve.nom}</span>
                    <div className="flex items-center">
                      <span className="mr-2">{eleve.pointsFrancais} pts</span>
                      {eleve.goldFrancais > 0 && <img src="/gold.png" alt="Or" className="w-5 h-5 mr-1" />}
                      {eleve.silverFrancais > 0 && <img src="/silver.png" alt="Argent" className="w-5 h-5 mr-1" />}
                      {eleve.bronzeFrancais > 0 && <img src="/bronze.png" alt="Bronze" className="w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/matieres/maths"
                className="block bg-blue-400 text-white p-6 rounded-lg shadow-lg hover:bg-blue-600 transition"
              >
                <h2 className="text-2xl font-bold">Maths</h2>
                <p>Dompte les chiffres et les équations.</p>
              </Link>
              {/* Classement Maths */}
              <div className="bg-green-100/90 backdrop-blur-sm p-6 rounded-lg shadow-lg mt-4">
                <h3 className="text-xl font-bold mb-4">Classement</h3>
                {eleves.maths?.slice(0, 5).map((eleve, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{index + 1}. {eleve.prenom} {eleve.nom}</span>
                    <div className="flex items-center">
                      <span className="mr-2">{eleve.pointsMaths} pts</span>
                      {eleve.goldMaths > 0 && <img src="/gold.png" alt="Or" className="w-5 h-5 mr-1" />}
                      {eleve.silverMaths > 0 && <img src="/silver.png" alt="Argent" className="w-5 h-5 mr-1" />}
                      {eleve.bronzeMaths > 0 && <img src="/bronze.png" alt="Bronze" className="w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center">
        © 2025 My Personal Teacher. Tous droits réservés.
      </footer>
    </div>
  );
}
