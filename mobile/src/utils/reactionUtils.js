// Fonction utilitaire pour convertir les noms de réaction en emojis
// Similaire à getEmojiForType du web
export const getEmojiForType = (reactionType) => {
  const emojiMap = {
    thumbsUp: "👍",
    heart: "❤️",
    laugh: "😂",
    surprise: "😮",
    sad: "😢",
    angry: "😡",
  };
  
  // Si c'est déjà un emoji unicode, retourne-le directement
  if (Object.values(emojiMap).includes(reactionType)) return reactionType;
  
  // Sinon, retourne l'emoji du mapping ou le texte brut
  return emojiMap[reactionType] || reactionType;
};

// Fonction pour formater les réactions d'un message
export const formatMessageReactions = (reactions) => {
  if (!reactions || !Array.isArray(reactions)) return [];
  
  return reactions.map((reaction) => ({
    ...reaction,
    emoji: getEmojiForType(reaction.reaction_type),
  }));
};