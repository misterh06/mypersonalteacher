const { execSync } = require('child_process');
const fs = require('fs');

// Lire le fichier .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');

// Convertir le contenu en tableau de lignes et filtrer les lignes vides
const envLines = envContent
  .split('\n')
  .filter(line => line.trim() !== '' && !line.startsWith('#'));

// Pour chaque ligne, créer une commande vercel env add
envLines.forEach(line => {
  const [key, value] = line.split('=').map(part => part.trim());
  if (key && value) {
    try {
      console.log(`Adding ${key}...`);
      execSync(`vercel env add ${key}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error adding ${key}: ${error.message}`);
    }
  }
});

console.log('Environment variables import completed!'); 