//app/matieres/math/
"use client";

import Link from 'next/link';
import ReactPlayer from 'react-player';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Chapitre 1', progress: 20 },
  { name: 'Chapitre 2', progress: 40 },
  { name: 'Chapitre 3', progress: 60 },
  { name: 'Chapitre 4', progress: 80 },
  { name: 'Chapitre 5', progress: 100 },
];

export default function MathPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header global */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">My Personal Teacher</div>
          <nav className="space-x-4">
            <Link href="/">Accueil</Link>
            <Link href="/profil">Profil</Link>
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Leçon de Mathématiques</h1>
        
        {/* Boutons pour accéder aux différentes fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link 
            href="/matieres/maths/exercices" 
            className="block bg-blue-500 text-white p-6 rounded shadow hover:bg-blue-600 transition"
          >
            <h3 className="text-2xl font-bold">Exercices Interactifs</h3>
            <p className="mt-2">Pratiquez avec des exercices variés pour renforcer vos acquis.</p>
          </Link>
          <Link 
            href="/matieres/maths/exercices/quizz" 
            className="block bg-green-500 text-white p-6 rounded shadow hover:bg-green-600 transition"
          >
            <h3 className="text-2xl font-bold">Quiz Personnalisés</h3>
            <p className="mt-2">Testez vos connaissances à travers des quiz adaptés.</p>
          </Link>
          <Link 
            href="/matieres/maths/devoirs/mon_devoir" 
            className="block bg-purple-500 text-white p-6 rounded shadow hover:bg-purple-600 transition"
          >
            <h3 className="text-2xl font-bold">Mes Devoirs</h3>
            <p className="mt-2">Suivez et remettez vos devoirs en ligne.</p>
          </Link>
          <Link 
            href="/matieres/maths/jeux/math_games" 
            className="block bg-orange-500 text-white p-6 rounded shadow hover:bg-orange-600 transition"
          >
            <h3 className="text-2xl font-bold">Jeux Mathématiques</h3>
            <p className="mt-2">Apprenez en vous amusant grâce à des jeux interactifs.</p>
          </Link>
        </div>

        {/* Section Contenu de la leçon */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Contenu de la leçon</h2>
          <div className="prose mb-6">
            <p>
              Bienvenue dans cette leçon interactive de mathématiques ! Ici, vous découvrirez les concepts essentiels de l'algèbre et de la géométrie,
              accompagnés d'exemples concrets et d'exercices pratiques.
            </p>
          </div>

          {/* Intégration du lecteur vidéo */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Vidéo de présentation</h3>
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded">
              <ReactPlayer url="https://www.youtube.com/watch?v=5or4a0uIyro&list=PL_1WVGjLTYqJvSAhg4uWx2xULWytyWU3s" width="100%" height="100%" />
            </div>
          </div>

          {/* Intégration de la visualisation interactive */}
          <div>
            <h3 className="text-2xl font-bold mb-2">Visualisation interactive</h3>
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded">
              <LineChart width={500} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progress" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
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
