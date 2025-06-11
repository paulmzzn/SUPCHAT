import MessageModel from "../models/Message.js";
import MessagePrive from "../models/MessagePrive.js";
import pool from "../config/dbConnection.js";
import { getMistralApiKey } from "../config/secrets.js";

const MISTRAL_API_KEY = getMistralApiKey();
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_USER_ID = "00000000-0000-0000-0000-000000000001";
const MISTRAL_USERNAME = "Mistral AI";
const MISTRAL_AVATAR =
  "https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp";

/**
 * Récupère l'historique des messages d'un canal avec limitation
 * @param {string} canalId - ID du canal
 * @param {number} limit - Nombre de messages à récupérer (défaut: 100)
 * @returns {Array} Historique des messages formatés pour Mistral
 */
const getChannelMessageHistory = async (canalId, limit = 100) => {
  try {
    const messages = await pool.query(
      `SELECT m.contenu, m.date_envoi, u.nom, m.fk_utilisateur, m.id_message
       FROM message m
       JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
       WHERE m.fk_canal = $1
       ORDER BY m.date_envoi DESC
       LIMIT $2`,
      [canalId, limit]
    );

    // Inverser l'ordre pour avoir les messages du plus ancien au plus récent
    const reversedMessages = messages.rows.reverse();

    return reversedMessages.map((msg) => ({
      role: msg.fk_utilisateur === MISTRAL_USER_ID ? "assistant" : "user",
      content:
        msg.fk_utilisateur === MISTRAL_USER_ID
          ? msg.contenu
          : `${msg.nom}: ${msg.contenu}`,
      timestamp: msg.date_envoi,
      messageId: msg.id_message,
      userId: msg.fk_utilisateur,
      userName: msg.nom,
    }));
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'historique du canal:",
      error
    );
    return [];
  }
};

/**
 * Récupère l'historique des messages privés entre deux utilisateurs
 * @param {string} userId1 - ID du premier utilisateur
 * @param {string} userId2 - ID du deuxième utilisateur (Mistral)
 * @param {number} limit - Nombre de messages à récupérer (défaut: 100)
 * @returns {Array} Historique des messages privés formatés pour Mistral
 */
const getPrivateMessageHistory = async (
  userId1,
  userId2 = MISTRAL_USER_ID,
  limit = 100
) => {
  try {
    const messages = await pool.query(
      `SELECT mp.contenu, mp.date_envoi, mp.fk_expediteur, 
              u_exp.nom as nom_expediteur, mp.id_message_prive
       FROM message_prive mp
       JOIN utilisateur u_exp ON mp.fk_expediteur = u_exp.id_utilisateur
       WHERE (mp.fk_expediteur = $1 AND mp.fk_destinataire = $2)
          OR (mp.fk_expediteur = $2 AND mp.fk_destinataire = $1)
       ORDER BY mp.date_envoi DESC
       LIMIT $3`,
      [userId1, userId2, limit]
    );

    // Inverser l'ordre pour avoir les messages du plus ancien au plus récent
    const reversedMessages = messages.rows.reverse();

    return reversedMessages.map((msg) => ({
      role: msg.fk_expediteur === MISTRAL_USER_ID ? "assistant" : "user",
      content:
        msg.fk_expediteur === MISTRAL_USER_ID
          ? msg.contenu
          : `${msg.nom_expediteur}: ${msg.contenu}`,
      timestamp: msg.date_envoi,
      messageId: msg.id_message_prive,
      userId: msg.fk_expediteur,
      userName: msg.nom_expediteur,
    }));
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'historique des messages privés:",
      error
    );
    return [];
  }
};

/**
 * Crée le contexte pour Mistral incluant l'historique et la question actuelle
 * @param {Array} messageHistory - Historique des messages
 * @param {string} currentQuestion - Question actuelle
 * @param {string} contextType - Type de contexte ('channel' ou 'private')
 * @returns {Array} Messages formatés pour l'API Mistral
 */
const createMistralContext = (
  messageHistory,
  currentQuestion,
  contextType = "channel"
) => {
  const systemPrompt = {
    role: "system",
    content: `Tu es Mistral AI, un assistant intelligent intégré dans SUPCHAT, une plateforme de communication d'équipe. 

Contexte: Tu es dans ${
      contextType === "channel"
        ? "un canal de discussion"
        : "une conversation privée"
    }.

Comportement:
- Réponds de manière naturelle et conversationnelle
- Utilise l'historique des messages pour comprendre le contexte
- Si quelqu'un fait référence à un message précédent, utilise l'historique pour comprendre
- Peux suivre les conversations et faire référence aux échanges précédents
- Réponds en français par défaut, mais adapte-toi à la langue utilisée
- Sois concis mais informatif
- Si tu ne comprends pas le contexte, demande des clarifications

L'historique des messages récents t'est fourni pour te permettre de suivre la conversation et de donner des réponses contextuelles.`,
  };

  const messages = [systemPrompt];

  // Ajouter l'historique des messages (ne garder que role et content)
  const cleanHistory = messageHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push(...cleanHistory);

  // Ajouter la question actuelle
  messages.push({
    role: "user",
    content: currentQuestion,
  });

  return messages;
};

/**
 * Appelle l'API Mistral avec le contexte approprié
 * @param {Array} messages - Messages formatés pour Mistral
 * @param {Object} options - Options supplémentaires
 * @returns {string} Réponse de Mistral
 */
const callMistralAPI = async (messages, options = {}) => {
  const { temperature = 0.7, maxTokens = 64000, timeout = 30000 } = options;

  if (!MISTRAL_API_KEY) {
    throw new Error("Clé API Mistral non configurée");
  }

  // Debug: vérifier le format des messages
  console.log("Messages envoyés à Mistral:", JSON.stringify(messages, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestBody = {
      model: "mistral-large-latest",
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    };

    console.log(
      "Corps de la requête Mistral:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Mistral - Status:", response.status);
      console.error("Erreur API Mistral - Text:", errorText);

      let errorDetails = "Erreur inconnue";

      try {
        const errorJson = JSON.parse(errorText);
        errorDetails =
          errorJson.error?.message ||
          errorJson.detail ||
          errorJson.message ||
          errorText;
      } catch (e) {
        errorDetails = errorText;
      }

      throw new Error(
        `Erreur API Mistral (${response.status}): ${errorDetails}`
      );
    }

    const result = await response.json();

    // Extraction robuste de la réponse
    if (
      result.choices &&
      Array.isArray(result.choices) &&
      result.choices.length > 0
    ) {
      if (result.choices[0].message && result.choices[0].message.content) {
        return result.choices[0].message.content;
      } else if (result.choices[0].content) {
        return result.choices[0].content;
      }
    }

    if (result.response) {
      return result.response;
    }

    if (result.output) {
      return result.output;
    }

    throw new Error("Format de réponse Mistral inattendu");
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Traite une question Mistral dans un canal avec historique
 * @param {string} canalId - ID du canal
 * @param {string} question - Question posée
 * @param {string} userId - ID de l'utilisateur qui pose la question
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Réponse et métadonnées
 */
export const processMistralChannelQuestion = async (
  canalId,
  question,
  userId,
  options = {}
) => {
  try {
    const { historyLimit = 100, includeContext = true } = options;

    // Récupérer l'historique si demandé
    let messageHistory = [];
    if (includeContext) {
      messageHistory = await getChannelMessageHistory(canalId, historyLimit);
    }

    // Créer le contexte pour Mistral
    const mistralMessages = createMistralContext(
      messageHistory,
      question,
      "channel"
    );

    // Appeler l'API Mistral
    const response = await callMistralAPI(mistralMessages);

    // Enregistrer la réponse en base de données
    const savedMessage = await MessageModel.create({
      contenu: response,
      fk_canal: canalId,
      fk_utilisateur: MISTRAL_USER_ID,
    });

    return {
      success: true,
      response: response,
      messageId: savedMessage.id_message,
      contextUsed: messageHistory.length > 0,
      historyLength: messageHistory.length,
    };
  } catch (error) {
    console.error(
      "Erreur lors du traitement de la question Mistral (canal):",
      error
    );
    throw error;
  }
};

/**
 * Traite une question Mistral en message privé avec historique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} question - Question posée
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Réponse et métadonnées
 */
export const processMistralPrivateQuestion = async (
  userId,
  question,
  options = {}
) => {
  try {
    const { historyLimit = 100, includeContext = true } = options;

    // Récupérer l'historique si demandé
    let messageHistory = [];
    if (includeContext) {
      messageHistory = await getPrivateMessageHistory(
        userId,
        MISTRAL_USER_ID,
        historyLimit
      );
    }

    // Créer le contexte pour Mistral
    const mistralMessages = createMistralContext(
      messageHistory,
      question,
      "private"
    );

    // Appeler l'API Mistral
    const response = await callMistralAPI(mistralMessages);

    // Enregistrer la réponse en base de données
    const savedMessage = await MessagePrive.create({
      contenu: response,
      fk_expediteur: MISTRAL_USER_ID,
      fk_destinataire: userId,
    });

    return {
      success: true,
      response: response,
      messageId: savedMessage.id_message_prive,
      contextUsed: messageHistory.length > 0,
      historyLength: messageHistory.length,
    };
  } catch (error) {
    console.error(
      "Erreur lors du traitement de la question Mistral (privé):",
      error
    );
    throw error;
  }
};

/**
 * Endpoint pour poser une question à Mistral dans un canal
 */
export const askMistralInChannel = async (req, res) => {
  try {
    const { canalId } = req.params;
    const { question, includeHistory = true, historyLimit = 100 } = req.body;
    const userId = req.user.id;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question requise",
      });
    }

    // Vérifier l'accès au canal
    const accessCheck = await pool.query(
      `SELECT c.* FROM canal c 
       JOIN workspace w ON c.fk_workspace = w.id_workspace 
       JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace 
       WHERE c.id_canal = $1 AND mw.fk_utilisateur = $2`,
      [canalId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Accès au canal non autorisé",
      });
    }

    const result = await processMistralChannelQuestion(
      canalId,
      question,
      userId,
      {
        historyLimit: includeHistory ? historyLimit : 0,
        includeContext: includeHistory,
      }
    );

    res.json(result);
  } catch (error) {
    console.error("Erreur dans askMistralInChannel:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du traitement de la question",
    });
  }
};

/**
 * Endpoint pour poser une question à Mistral en message privé
 */
export const askMistralPrivate = async (req, res) => {
  try {
    const { question, includeHistory = true, historyLimit = 100 } = req.body;
    const userId = req.user.id;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question requise",
      });
    }

    const result = await processMistralPrivateQuestion(userId, question, {
      historyLimit: includeHistory ? historyLimit : 0,
      includeContext: includeHistory,
    });

    res.json(result);
  } catch (error) {
    console.error("Erreur dans askMistralPrivate:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du traitement de la question",
    });
  }
};

/**
 * Endpoint pour obtenir l'historique des conversations avec Mistral
 */
export const getMistralHistory = async (req, res) => {
  try {
    const { type, canalId, limit = 20 } = req.query;
    const userId = req.user.id;

    let history = [];

    if (type === "channel" && canalId) {
      // Vérifier l'accès au canal
      const accessCheck = await pool.query(
        `SELECT c.* FROM canal c 
         JOIN workspace w ON c.fk_workspace = w.id_workspace 
         JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace 
         WHERE c.id_canal = $1 AND mw.fk_utilisateur = $2`,
        [canalId, userId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Accès au canal non autorisé",
        });
      }

      history = await getChannelMessageHistory(canalId, limit);
    } else if (type === "private") {
      history = await getPrivateMessageHistory(userId, MISTRAL_USER_ID, limit);
    } else {
      return res.status(400).json({
        success: false,
        message: "Type et paramètres requis (type: 'channel' ou 'private')",
      });
    }

    res.json({
      success: true,
      history: history,
      count: history.length,
    });
  } catch (error) {
    console.error("Erreur dans getMistralHistory:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors de la récupération de l'historique",
    });
  }
};

export {
  getChannelMessageHistory,
  getPrivateMessageHistory,
  createMistralContext,
  callMistralAPI,
  MISTRAL_USER_ID,
  MISTRAL_USERNAME,
  MISTRAL_AVATAR,
};
