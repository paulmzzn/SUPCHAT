// Script pour déplacer handleSelectUser avant les autres fonctions qui l'utilisent
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "useConversations.js");
const backupPath = path.resolve(__dirname, "useConversations.js.bak");

// Lire le fichier
let content = fs.readFileSync(filePath, "utf8");

// Extraire la fonction handleSelectUser
const selectUserRegex =
  /\/\*\*\s*\n\s*\*\s*Sélectionne un utilisateur pour la conversation[\s\S]*?const handleSelectUser[\s\S]*?\}\s*,\s*\[\]\s*\);/;
const selectUserMatch = content.match(selectUserRegex);

if (!selectUserMatch) {
  console.error("Fonction handleSelectUser non trouvée!");
  process.exit(1);
}

const selectUserFunc = selectUserMatch[0];

// Supprimer la fonction de sa position actuelle
content = content.replace(selectUserRegex, "");

// Trouver la position après la fonction deleteConversation
const insertPositionRegex =
  /\}\s*,\s*\[unreadMessageCounts,\s*updateUnreadCounts\]\s*\);/;
const insertPositionMatch = content.match(insertPositionRegex);

if (!insertPositionMatch) {
  console.error("Position d'insertion non trouvée!");
  process.exit(1);
}

// Insérer handleSelectUser après deleteConversation
const insertPosition =
  content.indexOf(insertPositionMatch[0]) + insertPositionMatch[0].length;
const newContent =
  content.slice(0, insertPosition) +
  "\n\n  " +
  selectUserFunc +
  content.slice(insertPosition);

// Écrire le nouveau contenu dans le fichier
fs.writeFileSync(filePath, newContent, "utf8");

console.log("Fonction handleSelectUser déplacée avec succès!");
