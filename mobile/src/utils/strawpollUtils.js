import strawpollService from '../services/StrawpollService';

// Fonction pour détecter et parser les sondages Strawpoll dans le texte des messages
export const parseStrawpollsInMessage = (messageText) => {
  if (!messageText) return { text: messageText, strawpolls: [] };

  const strawpolls = [];
  
  // Regex pour détecter les sondages au format: Sondage créé : [titre] [Voter](url) [strawpoll:id]
  const strawpollRegex = /Sondage créé\s*:\s*([^\[]*)\[([^\]]+)\]\((https?:\/\/strawpoll\.com\/[^\)]+)\)\s*\[strawpoll:([a-zA-Z0-9]+)\]/g;
  
  // Regex simple pour détecter les liens Strawpoll directs
  const directLinkRegex = /(https?:\/\/strawpoll\.com\/(?:polls\/)?([a-zA-Z0-9]+))/g;
  
  let match;
  let processedText = messageText;

  // Détecter les sondages au format complet
  while ((match = strawpollRegex.exec(messageText)) !== null) {
    const fullMatch = match[0];
    const title = match[1].trim();
    const linkText = match[2];
    const url = match[3];
    const pollId = match[4];

    strawpolls.push({
      type: 'strawpoll',
      title: title || linkText,
      url: url,
      pollId: pollId,
      originalText: fullMatch,
    });

    // Supprimer le texte du sondage du message pour éviter la duplication
    processedText = processedText.replace(fullMatch, '').trim();
  }

  // Détecter les liens Strawpoll directs (si aucun sondage formaté n'a été trouvé)
  if (strawpolls.length === 0) {
    strawpollRegex.lastIndex = 0; // Reset regex
    while ((match = directLinkRegex.exec(messageText)) !== null) {
      const url = match[1];
      const pollId = match[2];

      strawpolls.push({
        type: 'strawpoll',
        title: 'Sondage Strawpoll',
        url: url,
        pollId: pollId,
        originalText: match[0],
      });
    }
  }

  return {
    text: processedText,
    strawpolls: strawpolls,
  };
};

// Fonction pour créer le texte de message avec sondage
export const createStrawpollMessage = (title, pollUrl, pollId) => {
  return `Sondage créé : ${title} [Voter](${pollUrl}) [strawpoll:${pollId}]`;
};

// Fonction pour valider un ID de sondage Strawpoll
export const isValidStrawpollId = (pollId) => {
  return /^[a-zA-Z0-9]+$/.test(pollId);
};

// Fonction pour nettoyer le texte d'un titre de sondage
export const sanitizePollTitle = (title) => {
  if (!title) return '';
  
  return title
    .trim()
    .replace(/[\[\]]/g, '') // Supprimer les crochets
    .replace(/\n/g, ' ') // Remplacer les retours à la ligne par des espaces
    .substring(0, 200); // Limiter la longueur
};

// Fonction pour valider les options d'un sondage
export const validatePollOptions = (options) => {
  if (!Array.isArray(options)) return false;
  
  const validOptions = options
    .map(opt => opt?.toString().trim())
    .filter(Boolean);
    
  return validOptions.length >= 2 && validOptions.length <= 10;
};

// Fonction pour extraire les informations d'un sondage depuis une URL
export const extractPollInfoFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const pollId = strawpollService.extractPollIdFromUrl(url);
    if (!pollId) return null;
    
    return {
      pollId,
      url: strawpollService.buildPollUrl(pollId),
    };
  } catch (error) {
    console.error('Erreur extraction info sondage:', error);
    return null;
  }
};

// Fonction pour formater la date de création d'un sondage
export const formatPollDate = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp * 1000); // Strawpoll renvoie un timestamp en secondes
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '';
  }
};

// Fonction pour calculer le pourcentage de votes
export const calculateVotePercentage = (votes, totalVotes) => {
  if (!totalVotes || totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
};

// Fonction pour tronquer le texte avec ellipses
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};