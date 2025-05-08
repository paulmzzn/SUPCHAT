import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import MessageModel from "../models/Message.js";
import Reaction from "../models/Reaction.js";
import MessagePrive from "../models/MessagePrive.js"; // Ajout de l'importation de MessagePrive
import ReactionPrive from "../models/ReactionPrive.js"; // Ajout de l'importation de ReactionPrive
import pool from "../config/dbConnection.js"; // Add this import
// Assurez-vous que fetch est disponible (Node >= 18 ou import node-fetch)
// import fetch from 'node-fetch'; // Décommentez si Node < 18 et node-fetch est installé

// Charger les variables d'environnement
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "REDACTED";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; // Charger la clé API Mistral
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"; // URL de l'API Mistral

const MISTRAL_USER_ID = "00000000-0000-0000-0000-000000000001"; // <<< UTILISER L'UUID FIXE
const MISTRAL_USERNAME = "Mistral AI";
const MISTRAL_AVATAR =
  "https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp";

// Ajouter l'UUID système pour les messages système
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";
const SYSTEM_USERNAME = "Système";

const MISTRAL_API_TIMEOUT_MS = 120000; // 120 secondes = 2 minutes

// Ajouter un objet pour suivre les utilisateurs en ligne par workspace
const onlineUsers = {
  // Format: { workspaceId: Set([userId1, userId2, ...]) }
};

// Ajouter une fonction pour mettre à jour le statut utilisateur dans la BD
const updateUserStatus = async (userId, status) => {
  try {
    await pool.query(
      "UPDATE utilisateur SET fk_statut = $1 WHERE id_utilisateur = $2",
      [status, userId]
    );
    console.log(`Status de l'utilisateur ${userId} mis à jour: ${status}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut utilisateur:", error);
  }
};

const socketManager = (io) => {
  console.log("socketManager initialized with Socket.IO instance");

  // Middleware pour authentifier les utilisateurs via socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log("Socket.IO: Pas de token fourni");
        return next(new Error("Authentication error: Token required"));
      }

      console.log(
        "Socket.IO: Tentative d'authentification avec token:",
        token.substring(0, 20) + "..."
      );

      // Vérification préliminaire du format JWT (doit avoir 3 segments)
      if (!token.includes('.') || token.split('.').length !== 3) {
        console.error("Socket.IO: Format JWT invalide (ne contient pas 3 segments)");
        return next(new Error("Authentication error: Invalid JWT format"));
      }

      jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
          console.error("Socket.IO: Token invalide", err);
          return next(new Error("Authentication error: Invalid token"));
        }
        console.log("Socket.IO: Utilisateur authentifié", decoded.id);
        socket.user = decoded;
        next();
      });
    } catch (error) {
      console.error("Socket.IO: Erreur d'authentification", error);
      next(new Error("Authentication error: " + error.message));
    }
  });

  // Événements de connexion
  io.on("connection", (socket) => {
    console.log(
      `Utilisateur connecté: ${socket.id}, User ID: ${socket.user?.id}`
    );

    const userId = socket.user?.id;

    // Si l'utilisateur est authentifié, mettre à jour son statut
    if (userId) {
      // Mettre à jour le statut dans la BD (1 = en ligne)
      updateUserStatus(userId, 1);

      // Informer tous les workspaces de l'utilisateur qu'il est en ligne
      socket.on("userJoinedWorkspaces", ({ workspaces }) => {
        if (Array.isArray(workspaces)) {
          workspaces.forEach((workspaceId) => {
            // Initialiser le set si nécessaire
            if (!onlineUsers[workspaceId]) {
              onlineUsers[workspaceId] = new Set();
            }

            // Ajouter l'utilisateur à la liste des utilisateurs en ligne
            onlineUsers[workspaceId].add(userId);

            // Émettre l'événement vers tous les membres du workspace
            io.to(`${workspaceId}`).emit("userStatusChanged", {
              userId,
              status: "online",
              workspaceId,
            });

            console.log(
              `Utilisateur ${userId} en ligne dans le workspace ${workspaceId}`
            );
            console.log(
              `Utilisateurs en ligne dans ce workspace:`,
              Array.from(onlineUsers[workspaceId])
            );
          });
        }
      });
    }

    // Joindre un canal
    socket.on("joinCanal", (data) => {
      const { canalId, workspaceId } = data;
      console.log(
        `Utilisateur ${socket.user?.id} rejoint le canal ${canalId} du workspace ${workspaceId}`
      );

      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }

      socket.currentRoom = `${canalId}`;
      socket.join(`${canalId}`);

      // --- AJOUT : rejoindre aussi la room du workspace pour les events globaux ---
      if (workspaceId) {
        socket.join(`${workspaceId}`);
        console.log(
          `Socket ${socket.id} rejoint la room workspace ${workspaceId}`
        );
      }

      // Informer le client que le canal a été rejoint
      socket.emit("canalJoined", { canalId, status: "success" });
    });

    // Joindre la room DM de l'utilisateur (pour recevoir ses messages privés)
    socket.on("joinPrivate", () => {
      if (socket.user?.id) {
        console.log(
          `Socket.IO: Utilisateur ${socket.user.id} rejoint sa room privée dm:${socket.user.id}`
        );
        socket.join(`dm:${socket.user.id}`);
        socket.emit("privateRoomJoined", { status: "success" });
      }
    });

    // Nouveau handler pour rejoindre explicitement la room du workspace
    socket.on("joinWorkspace", (data) => {
      const { workspaceId } = data;
      if (workspaceId) {
        socket.join(`${workspaceId}`);
        console.log(
          `[WS DEBUG] Socket ${socket.id} rejoint explicitement la room workspace ${workspaceId}`
        );
      }
    });

    // Améliorer le handler de message privé pour gérer les tempId et la déduplication
    socket.on(
      "privateMessage",
      async ({ destinataireId, contenu, tempId, replyToId }, callback) => {
        try {
          console.log(
            `Socket.IO: Message privé reçu de ${
              socket.user?.id
            } pour ${destinataireId}: ${contenu.substring(0, 30)}`
          );

          const expediteurId = socket.user.id;

          if (!destinataireId || !contenu) {
            console.warn("Socket.IO: Données de message privé incomplètes");
            if (callback)
              callback({
                ok: false,
                message: "destinataireId et contenu requis",
              });
            return;
          }

          // Vérifier si un message identique a été créé récemment (déduplication)
          // Utiliser MessagePrive pour la déduplication au lieu de pool.query directement
          const recentMessages = await MessagePrive.getRecentSimilarMessages(
            expediteurId,
            destinataireId,
            contenu
          );

          if (recentMessages && recentMessages.length > 0) {
            console.log(
              "Socket.IO: Message privé similaire trouvé, éviter duplication"
            );
            const existingMessage = recentMessages[0];

            // Émettre le message existant avec le tempId pour que le frontend puisse faire la correspondance
            const messageWithTempId = { ...existingMessage, tempId };
            io.to(`dm:${expediteurId}`)
              .to(`dm:${destinataireId}`)
              .emit("privateMessage", messageWithTempId);

            if (callback)
              callback({
                ok: true,
                message: "Message existant récupéré",
                id: existingMessage.id_message_prive,
              });
            return;
          }

          // Créer le message en base de données
          console.log("Socket.IO: Création du message privé en base");
          const message = await MessagePrive.create({
            contenu,
            fk_expediteur: expediteurId,
            fk_destinataire: destinataireId,
            parent_id: replyToId, // Ajout du parent_id
          });

          // Ajouter le tempId au message émis pour que le frontend puisse faire la correspondance
          if (tempId) {
            message.tempId = tempId;
          }

          // Ajouter le parent_message si parent_id présent
          if (message.parent_id) {
            const parent = await MessagePrive.getById(message.parent_id);
            if (parent) {
              message.parent_message = {
                id_message_prive: parent.id_message_prive,
                contenu: parent.contenu,
                fk_expediteur: parent.fk_expediteur,
              };
            }
          }

          console.log(
            "Socket.IO: Message privé créé avec ID:",
            message.id_message_prive
          );

          // Émettre vers les deux utilisateurs
          io.to(`dm:${expediteurId}`)
            .to(`dm:${destinataireId}`)
            .emit("privateMessage", message);

          // IMPORTANT: Toujours répondre au callback
          if (callback) {
            callback({
              ok: true,
              message: "Message reçu côté backend",
              id: message.id_message_prive,
            });
          }
        } catch (error) {
          console.error(
            "Socket.IO: Erreur lors de la création du message privé:",
            error
          );
          if (callback) callback({ ok: false, message: error.message });
          else
            socket.emit("error", {
              message: "Erreur lors de l'envoi du message privé",
            });
        }
      }
    );

    // Edition d'un message privé (seul l'expéditeur)
    socket.on("editPrivateMessage", async ({ id, contenu }) => {
      try {
        const userId = socket.user.id;
        const updated = await MessagePrive.updateMessage(id, userId, contenu);
        if (!updated) {
          socket.emit("error", { message: "Modification refusée" });
          return;
        }
        io.to(`dm:${updated.fk_expediteur}`)
          .to(`dm:${updated.fk_destinataire}`)
          .emit("privateMessageUpdated", updated);
      } catch (error) {
        socket.emit("error", {
          message: "Erreur lors de la modification du message privé",
        });
      }
    });

    // Suppression d'un message privé (seul l'expéditeur)
    socket.on("deletePrivateMessage", async ({ id }) => {
      try {
        const userId = socket.user.id;
        const deleted = await MessagePrive.deleteMessage(id, userId);
        if (!deleted) {
          socket.emit("error", { message: "Suppression refusée" });
          return;
        }

        io.to(`dm:${deleted.fk_expediteur}`)
          .to(`dm:${deleted.fk_destinataire}`)
          .emit("privateMessageDeleted", { id });
      } catch (error) {
        socket.emit("error", {
          message: "Erreur lors de la suppression du message privé",
        });
      }
    });

    // Accusé de lecture (seul le destinataire)
    socket.on("readPrivateMessage", async ({ id }) => {
      try {
        const userId = socket.user.id;
        const updated = await MessagePrive.markAsRead(id, userId);
        if (!updated) {
          socket.emit("error", { message: "Non autorisé" });
          return;
        }
        io.to(`dm:${updated.fk_expediteur}`).emit("privateMessageRead", {
          id,
          date_lecture: updated.date_lecture,
        });
      } catch (error) {
        socket.emit("error", { message: "Erreur lors de l'accusé de lecture" });
      }
    });

    // Recevoir un message
    socket.on("message", async (data) => {
      try {
        console.log("Socket.IO: Message reçu", data);
        const { canal_id, content, workspace_id, parent_id, is_system_message } =
          data;

        if (!canal_id || !content) {
          console.error("Socket.IO: Données de message incomplètes");
          socket.emit("error", { message: "Données de message incomplètes" });
          return;
        }

        // Pour les messages système, on les enregistre avec l'UUID système
        if (is_system_message) {
          console.log(
            "Socket.IO: Message système détecté, enregistrement en base:",
            content
          );

          try {
            // Créer le message système en base de données avec l'UUID système
            const systemDbMessage = await MessageModel.create({
              contenu: content,
              fk_canal: canal_id,
              fk_utilisateur: SYSTEM_USER_ID, // Utiliser l'UUID système
              system_type: data.system_type || "video_call",
            });

            // Récupérer le message avec toutes ses infos
            const fullSystemMessage = await MessageModel.getById(
              systemDbMessage.id_message
            );

            if (fullSystemMessage) {
              // Formater le message pour l'émission
              const formattedSystemMessage = {
                ...fullSystemMessage,
                nom: SYSTEM_USERNAME,
                is_system_message: true,
                date_creation:
                  fullSystemMessage.date_creation ||
                  fullSystemMessage.created_at ||
                  new Date().toISOString(),
              };

              console.log(
                "Socket.IO: Émission du message système enregistré:",
                formattedSystemMessage
              );
              io.to(`${canal_id}`).emit("message", formattedSystemMessage);
            } else {
              console.warn(
                "Socket.IO: Message système créé mais non trouvé pour l'émission"
              );
            }
          } catch (error) {
            console.error(
              "Socket.IO: Erreur lors de l'enregistrement du message système:",
              error
            );

            // En cas d'erreur, on crée un message temporaire sans enregistrement en base
            const fallbackSystemMessage = {
              id_message: `system-${Date.now()}`,
              contenu: content,
              fk_canal: canal_id,
              fk_utilisateur: SYSTEM_USER_ID,
              nom: SYSTEM_USERNAME,
              date_creation: new Date().toISOString(),
              is_system_message: true,
              system_type: data.system_type || "video_call",
            };

            io.to(`${canal_id}`).emit("message", fallbackSystemMessage);
          }
          return;
        }

        // Pour les messages normaux, continuer avec le processus habituel
        const userMessage = await MessageModel.create({
          contenu: content,
          fk_canal: canal_id,
          fk_utilisateur: socket.user.id,
          parent_id: parent_id, // Sauvegarder le parent_id si présent
        });

        // Récupérer le message complet avec infos utilisateur
        const fullUserMessage = await MessageModel.getById(
          userMessage.id_message
        );

        if (fullUserMessage) {
          const formattedUserMessage = {
            ...fullUserMessage,
            date_creation:
              fullUserMessage.date_creation ||
              fullUserMessage.created_at ||
              new Date().toISOString(),
          };
          console.log(
            `Socket.IO: Émission du message utilisateur formaté:`,
            formattedUserMessage
          );
          io.to(`${canal_id}`).emit("message", formattedUserMessage); // Émettre le message de l'utilisateur
        } else {
          console.warn(
            "Socket.IO: Message utilisateur enregistré mais non émis (non trouvé)"
          );
        }

        // Vérifier si le message mentionne @mistral
        if (content.toLowerCase().startsWith("@mistral")) {
          if (!MISTRAL_API_KEY) {
            console.error("Clé API Mistral non configurée.");
            // Envoyer un message d'erreur dans le chat si la clé n'est pas configurée
            const errorMessage = {
              id_message: `error-${Date.now()}`, // ID unique pour le message d'erreur
              contenu:
                "Désolé, l'intégration Mistral AI n'est pas configurée correctement (clé API manquante).",
              fk_canal: canal_id,
              fk_utilisateur: MISTRAL_USER_ID, // Utiliser l'UUID du bot
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              date_creation: new Date().toISOString(),
              reactions: [],
              isBot: true, // Indicateur pour le frontend
            };
            io.to(`${canal_id}`).emit("message", errorMessage);
            return;
          }

          const question = content.substring("@mistral".length).trim();
          console.log(`Socket.IO: Question pour Mistral AI: "${question}"`);

          // *** Envoyer l'indicateur "Mistral est en train d'écrire..." ***
          io.to(`${canal_id}`).emit("typing", {
            userId: MISTRAL_USER_ID,
            username: MISTRAL_USERNAME,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log(
              `Socket.IO: Timeout API Mistral après ${MISTRAL_API_TIMEOUT_MS}ms`
            );
            controller.abort();
          }, MISTRAL_API_TIMEOUT_MS);

          try {
            const mistralResponse = await fetch(MISTRAL_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${MISTRAL_API_KEY}`,
              },
              body: JSON.stringify({
                model: "mistral-large-latest", // Ou un autre modèle Mistral
                messages: [{ role: "user", content: question }],
                // temperature: 0.7,
                // max_tokens: 1000 // Augmenter si nécessaire, mais attention aux coûts/limites
              }),
              signal: controller.signal, // Associer l'AbortController
            });

            clearTimeout(timeoutId); // Annuler le timeout si la réponse arrive à temps

            // *** Arrêter l'indicateur "Mistral est en train d'écrire..." (succès) ***
            io.to(`${canal_id}`).emit("stopTyping", {
              userId: MISTRAL_USER_ID,
            });

            if (!mistralResponse.ok) {
              const errorBody = await mistralResponse.text();
              console.error(
                `Erreur API Mistral (${mistralResponse.status}): ${errorBody}`
              );
              throw new Error(
                `Erreur de l'API Mistral: ${mistralResponse.statusText}`
              );
            }

            const mistralData = await mistralResponse.json();
            const mistralAnswer =
              mistralData.choices && mistralData.choices[0]
                ? mistralData.choices[0].message.content
                : "Désolé, je n'ai pas pu générer de réponse.";

            // *** Enregistrer la réponse de Mistral en base de données ***
            let savedMistralMessage;
            try {
              savedMistralMessage = await MessageModel.create({
                contenu: mistralAnswer,
                fk_canal: canal_id,
                fk_utilisateur: MISTRAL_USER_ID, // <<< Utiliser l'UUID ici aussi
                // parent_id: userMessage.id_message // Optionnel: Lier la réponse à la question
              });
              console.log(
                "Socket.IO: Réponse de Mistral enregistrée en DB:",
                savedMistralMessage
              );

              // Créer l'objet message pour l'émission UNIQUEMENT si l'enregistrement a réussi
              const mistralMessageForEmit = {
                id_message: savedMistralMessage.id_message,
                contenu: mistralAnswer,
                fk_canal: canal_id,
                fk_utilisateur: MISTRAL_USER_ID,
                nom: MISTRAL_USERNAME,
                photo_de_profil: MISTRAL_AVATAR,
                date_creation:
                  savedMistralMessage.created_at || new Date().toISOString(),
                reactions: [],
                isBot: false,
              };

              console.log(
                `Socket.IO: Émission de la réponse de Mistral enregistrée:`,
                mistralMessageForEmit
              );
              io.to(`${canal_id}`).emit("message", mistralMessageForEmit); // Émettre le message enregistré
            } catch (dbError) {
              // *** Arrêter l'indicateur "Mistral est en train d'écrire..." (erreur DB) ***
              // (Déjà arrêté avant, mais on s'assure qu'il l'est)
              io.to(`${canal_id}`).emit("stopTyping", {
                userId: MISTRAL_USER_ID,
              });
              console.error(
                "Socket.IO: ERREUR FATALE lors de l'enregistrement de la réponse Mistral en DB. Le message n'a pas été envoyé.",
                dbError
              );
              // NE PAS envoyer de message au client si l'enregistrement échoue.
              // Optionnel : Envoyer un message d'erreur spécifique à l'utilisateur qui a posé la question ?
              // socket.emit('error', { message: 'Erreur interne: Impossible d\'enregistrer la réponse du bot.' });
            }
          } catch (apiError) {
            clearTimeout(timeoutId); // Nettoyer le timeout en cas d'erreur aussi
            // *** Arrêter l'indicateur "Mistral est en train d'écrire..." (erreur API/Timeout) ***
            io.to(`${canal_id}`).emit("stopTyping", {
              userId: MISTRAL_USER_ID,
            });

            let errorMessageContent = `Désolé, une erreur est survenue lors de la communication avec Mistral AI.`;
            if (apiError.name === "AbortError") {
              console.error(
                "Socket.IO: L'appel à l'API Mistral a dépassé le délai imparti."
              );
              errorMessageContent = `Désolé, la génération de la réponse a pris trop de temps.`;
            } else {
              console.error(
                "Socket.IO: Erreur lors de l'appel à l'API Mistral",
                apiError
              );
              errorMessageContent = `Désolé, une erreur est survenue lors de la communication avec Mistral AI: ${apiError.message}`;
            }

            // Envoyer un message d'erreur dans le chat (non stocké en DB)
            const errorMessage = {
              id_message: `error-${Date.now()}`,
              contenu: errorMessageContent,
              fk_canal: canal_id,
              fk_utilisateur: MISTRAL_USER_ID,
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              date_creation: new Date().toISOString(),
              reactions: [],
              isBot: false,
            };
            io.to(`${canal_id}`).emit("message", errorMessage);
          }
        }
      } catch (error) {
        console.error("Socket.IO: Erreur de traitement de message", error);
        socket.emit("error", {
          message: "Erreur lors du traitement du message",
        });
      }
    });

    // Suppression d'un message de canal (WebSocket)
    socket.on("deleteMessage", async ({ messageId }) => {
      try {
        if (!messageId) {
          socket.emit("error", { message: "ID du message manquant" });
          return;
        }
        const userId = socket.user.id;
        const message = await MessageModel.getById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message non trouvé" });
          return;
        }
        if (message.fk_utilisateur !== userId) {
          socket.emit("error", {
            message: "Vous ne pouvez supprimer que vos propres messages",
          });
          return;
        }
        await MessageModel.delete(messageId);
        io.to(`${message.fk_canal}`).emit("deleteMessage", { messageId });
      } catch (error) {
        console.error(
          "Erreur lors de la suppression du message via WebSocket:",
          error
        );
        socket.emit("error", {
          message: "Erreur lors de la suppression du message",
        });
      }
    });
    
    // Nouvel événement pour marquer un canal comme lu
    socket.on("markChannelAsRead", async ({ channelId }) => {
      try {
        const userId = socket.user.id;
        
        if (!channelId) {
          socket.emit("error", { message: "ID du canal manquant" });
          return;
        }
        
        console.log(`Socket.IO: Marquage du canal ${channelId} comme lu par l'utilisateur ${userId}`);
        
        // Marquer le canal comme lu
        await MessageModel.markChannelAsRead(userId, channelId);
        
        // Récupérer le nouveau décompte des messages non lus
        const unreadCounts = await MessageModel.getUnreadCountByChannel(userId);
        
        // Calculer le total des messages non lus
        let total = 0;
        if (unreadCounts && unreadCounts.channels) {
          Object.values(unreadCounts.channels).forEach(channel => {
            total += channel.count || 0;
          });
        }
        
        // Notifier l'utilisateur pour mettre à jour les badges
        socket.emit("unreadChannelMessagesUpdated", { 
          channels: unreadCounts.channels || {}, 
          total: total 
        });
        
        // Envoyer une confirmation
        socket.emit("channelMarkedAsRead", { channelId, success: true });
        
        console.log(`Socket.IO: Canal ${channelId} marqué comme lu avec succès, compteurs mis à jour`);
      } catch (error) {
        console.error("Socket.IO: Erreur lors du marquage du canal comme lu:", error);
        socket.emit("error", { message: "Erreur lors du marquage du canal comme lu" });
      }
    });


    // Nouvel événement pour gérer directement les requêtes adressées à Mistral
    socket.on("mistralRequest", async (data) => {
      try {
        console.log("Requête directe à Mistral reçue:", data);
        const { content, channelId } = data;

        if (!channelId || !content) {
          console.error("Socket.IO: Données de message Mistral incomplètes");
          socket.emit("error", { message: "Données de message incomplètes" });
          return;
        }

        // Enregistrer le message de l'utilisateur en base de données
        const userMessage = await MessageModel.create({
          contenu: content,
          fk_canal: channelId,
          fk_utilisateur: socket.user.id,
        });

        // Récupérer le message complet avec infos utilisateur
        const fullUserMessage = await MessageModel.getById(
          userMessage.id_message
        );

        if (fullUserMessage) {
          // Diffuser le message aux membres du canal
          io.to(`${channelId}`).emit("message", {
            ...fullUserMessage,
            date_creation:
              fullUserMessage.date_creation ||
              fullUserMessage.created_at ||
              new Date().toISOString(),
          });

          // Indiquer que Mistral est en train d'écrire avec l'événement 'typing'
          io.to(`${channelId}`).emit("typing", {
            userId: MISTRAL_USER_ID,
            username: MISTRAL_USERNAME,
          });

          // Extraire le contenu réel de la question (enlever @Mistral)
          const question = content.replace(/@Mistral(\s+AI)?/gi, "").trim();

          try {
            if (!MISTRAL_API_KEY) {
              throw new Error("Clé API Mistral manquante");
            }

            // Faire la requête à l'API Mistral avec timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              MISTRAL_API_TIMEOUT_MS
            );

            const response = await fetch(MISTRAL_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MISTRAL_API_KEY}`,
              },
              body: JSON.stringify({
                model: "mistral-large-latest",
                messages: [{ role: "user", content: question }],
                temperature: 0.7,
                max_tokens: 800,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                `Erreur API Mistral: ${response.status} ${response.statusText}`
              );
            }

            const result = await response.json();
            const answer = result.choices[0].message.content;

            // Créer un message de réponse de Mistral dans la base de données
            const botMessage = await MessageModel.create({
              contenu: answer,
              fk_canal: channelId,
              fk_utilisateur: MISTRAL_USER_ID,
            });

            // Récupérer le message complet avec infos utilisateur
            const fullBotMessage = await MessageModel.getById(
              botMessage.id_message
            );

            // Après avoir reçu la réponse, arrêter l'indication de frappe
            io.to(`${channelId}`).emit("stopTyping", {
              userId: MISTRAL_USER_ID,
            });

            // Diffuser le message de Mistral aux membres du canal
            io.to(`${channelId}`).emit("message", {
              ...fullBotMessage,
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              isBot: false,
              date_creation:
                fullBotMessage.created_at || new Date().toISOString(),
            });
          } catch (error) {
            // En cas d'erreur, arrêter également l'indication de frappe
            io.to(`${channelId}`).emit("stopTyping", {
              userId: MISTRAL_USER_ID,
            });

            console.error(
              "Erreur lors de la communication avec Mistral:",
              error
            );

            // Créer un message d'erreur de Mistral
            const errorMessage = await MessageModel.create({
              contenu:
                "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.",
              fk_canal: channelId,
              fk_utilisateur: MISTRAL_USER_ID,
            });

            const fullErrorMessage = await MessageModel.getById(
              errorMessage.id_message
            );

            // Diffuser le message d'erreur
            io.to(`${channelId}`).emit("message", {
              ...fullErrorMessage,
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              isBot: false,
              date_creation:
                fullErrorMessage.created_at || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du traitement de la requête Mistral:",
          error
        );
        socket.emit("error", {
          message: "Erreur lors du traitement de la requête",
        });
      }
    });

    // Nouvel événement pour gérer les réactions aux messages
    socket.on("addReaction", async (data) => {
      try {
        console.log("Socket.IO: Réaction reçue", data);
        const { messageId, reaction_type, canalId } = data;

        if (!messageId || !reaction_type || !canalId) {
          console.error("Socket.IO: Données de réaction incomplètes");
          socket.emit("error", { message: "Données de réaction incomplètes" });
          return;
        }

        // Ajouter la réaction en base de données
        await Reaction.create({
          fk_message: messageId,
          fk_utilisateur: socket.user.id,
          reaction_type,
        });

        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await Reaction.getByMessage(
          messageId,
          socket.user.id
        );

        // Diffuser à tous les utilisateurs du canal
        io.to(`${canalId}`).emit("messageReaction", {
          messageId,
          reactions: updatedReactions,
        });
      } catch (error) {
        // Gérer l'erreur si la réaction existe déjà (contrainte unique)
        if (error.code === "23505") {
          // Code d'erreur PostgreSQL pour violation d'unicité
          console.log(
            `L'utilisateur ${socket.user.id} a déjà réagi avec ${reaction_type} au message ${messageId}`
          );
          // Optionnel: renvoyer les réactions actuelles pour synchroniser le client
          const currentReactions = await Reaction.getByMessage(
            messageId,
            socket.user.id
          );
          socket.emit("messageReaction", {
            messageId,
            reactions: currentReactions,
          });
        } else {
          console.error("Socket.IO: Erreur de traitement de réaction", error);
          socket.emit("error", {
            message: "Erreur lors du traitement de la réaction",
          });
        }
      }
    });

    // Nouvel événement pour gérer la suppression des réactions
    socket.on("removeReaction", async (data) => {
      try {
        console.log("Socket.IO: Suppression de réaction", data);
        const { messageId, reaction_type, canalId } = data;

        if (!messageId || !reaction_type || !canalId) {
          console.error(
            "Socket.IO: Données de suppression de réaction incomplètes"
          );
          socket.emit("error", { message: "Données incomplètes" });
          return;
        }

        // Supprimer la réaction en base de données
        await Reaction.delete(messageId, socket.user.id, reaction_type);

        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await Reaction.getByMessage(
          messageId,
          socket.user.id
        );

        // Diffuser à tous les utilisateurs du canal
        io.to(`${canalId}`).emit("messageReaction", {
          messageId,
          reactions: updatedReactions,
        });
      } catch (error) {
        console.error("Socket.IO: Erreur de suppression de réaction", error);
        socket.emit("error", {
          message: "Erreur lors de la suppression de la réaction",
        });
      }
    });

    // Ajouter des handlers pour différents événements d'erreur de socket
    socket.on("error", (err) => {
      console.error("Socket.IO: Erreur socket individuelle:", err);
    });

    // Nouvel événement pour gérer les réactions aux messages privés
    socket.on("addPrivateMessageReaction", async (data) => {
      try {
        console.log("Socket.IO: Réaction à message privé reçue", data);
        const { id: messageId, reaction: reaction_type } = data;

        if (!messageId || !reaction_type) {
          console.error("Socket.IO: Données de réaction incomplètes");
          socket.emit("error", { message: "Données de réaction incomplètes" });
          return;
        }

        // Récupérer le message privé
        const message = await MessagePrive.getById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message privé non trouvé" });
          return;
        }

        // Vérifier que l'utilisateur est soit l'expéditeur soit le destinataire du message
        if (
          message.fk_expediteur !== socket.user.id &&
          message.fk_destinataire !== socket.user.id
        ) {
          socket.emit("error", {
            message: "Non autorisé à réagir à ce message",
          });
          return;
        }

        // Ajouter la réaction en base de données
        await ReactionPrive.create({
          fk_message_prive: messageId,
          fk_utilisateur: socket.user.id,
          reaction_type,
        });

        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await ReactionPrive.getByMessage(
          messageId,
          socket.user.id
        );

        // Diffuser aux deux utilisateurs concernés par le message privé
        io.to(`dm:${message.fk_expediteur}`)
          .to(`dm:${message.fk_destinataire}`)
          .emit("privateMessageReaction", {
            messageId,
            reactions: updatedReactions,
          });
      } catch (error) {
        // Gérer l'erreur si la réaction existe déjà (contrainte unique)
        if (error.code === "23505") {
          // Code d'erreur PostgreSQL pour violation d'unicité
          console.log(
            `L'utilisateur ${socket.user.id} a déjà réagi au message privé ${data.id}`
          );
          // Optionnel: renvoyer les réactions actuelles pour synchroniser le client
          const message = await MessagePrive.getById(data.id);
          if (message) {
            const currentReactions = await ReactionPrive.getByMessage(
              data.id,
              socket.user.id
            );
            socket.emit("privateMessageReaction", {
              messageId: data.id,
              reactions: currentReactions,
            });
          }
        } else {
          console.error(
            "Socket.IO: Erreur de traitement de réaction au message privé",
            error
          );
          socket.emit("error", {
            message: "Erreur lors du traitement de la réaction",
          });
        }
      }
    });

    // Nouvel événement pour gérer la suppression des réactions aux messages privés
    socket.on("removePrivateMessageReaction", async (data) => {
      try {
        console.log("Socket.IO: Suppression de réaction de message privé", data);
        const { id: messageId, reaction: reaction_type } = data;

        if (!messageId || !reaction_type) {
          console.error(
            "Socket.IO: Données de suppression de réaction incomplètes"
          );
          socket.emit("error", { message: "Données incomplètes" });
          return;
        }

        // Récupérer le message privé
        const message = await MessagePrive.getById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message privé non trouvé" });
          return;
        }

        // Supprimer la réaction en base de données
        await ReactionPrive.delete(messageId, socket.user.id, reaction_type);

        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await ReactionPrive.getByMessage(
          messageId,
          socket.user.id
        );

        // Diffuser aux deux utilisateurs concernés par le message privé
        io.to(`dm:${message.fk_expediteur}`)
          .to(`dm:${message.fk_destinataire}`)
          .emit("privateMessageReaction", {
            messageId,
            reactions: updatedReactions,
          });
      } catch (error) {
        console.error(
          "Socket.IO: Erreur de suppression de réaction de message privé",
          error
        );
        socket.emit("error", {
          message: "Erreur lors de la suppression de la réaction",
        });
      }
    });

    // Nouvel événement pour le changement manuel de statut
    socket.on("setUserStatus", async ({ status }) => {
      if (!socket.user?.id) return;

      const userId = socket.user.id;
      let statusCode;

      // Convertir le statut textuel en code numérique
      switch (status) {
        case "online":
          statusCode = 1;
          break;
        case "away":
          statusCode = 2;
          break;
        case "dnd":
          statusCode = 3;
          break;
        case "invisible":
          statusCode = 4;
          break;
        default:
          statusCode = 1; // Par défaut: en ligne
      }

      // Mettre à jour dans la base de données
      await updateUserStatus(userId, statusCode);

      // Récupérer les workspaces de l'utilisateur depuis la base de données
      try {
        const workspacesResult = await pool.query(
          "SELECT workspace_id FROM workspace_membre WHERE user_id = $1",
          [userId]
        );

        const userWorkspaces = workspacesResult.rows.map(
          (row) => row.workspace_id
        );

        // Informer tous les workspaces de l'utilisateur
        userWorkspaces.forEach((workspaceId) => {
          // Émettre l'événement à tous les membres du workspace, qu'ils soient en ligne ou non
          io.to(`${workspaceId}`).emit("userStatusChanged", {
            userId,
            status: status === "invisible" ? "offline" : status,
            workspaceId,
          });

          console.log(
            `Statut utilisateur ${userId} mis à jour à ${status} dans workspace ${workspaceId}`
          );
        });

        // Émission globale pour tous les sockets (pour les messages privés)
        io.emit("userStatusChanged", {
          userId,
          status: status === "invisible" ? "offline" : status,
        });
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des workspaces pour mise à jour de statut:",
          error
        );
      }
    });

    // Gérer la déconnexion
    socket.on("disconnect", async () => {
      const userId = socket.user?.id;

      if (userId) {
        console.log(`Utilisateur déconnecté: ${socket.id}, User ID: ${userId}`);

        // Mettre à jour le statut dans la BD (4 = invisible/déconnecté)
        await updateUserStatus(userId, 4);

        // Informer tous les workspaces où l'utilisateur était en ligne
        Object.keys(onlineUsers).forEach((workspaceId) => {
          if (onlineUsers[workspaceId].has(userId)) {
            // Retirer l'utilisateur de la liste des utilisateurs en ligne
            onlineUsers[workspaceId].delete(userId);

            // Émettre l'événement vers tous les membres du workspace
            io.to(`${workspaceId}`).emit("userStatusChanged", {
              userId,
              status: "offline",
              workspaceId,
            });
          }
        });
      }
    });

    socket.on("disconnecting", (reason) => {
      console.log(
        `Socket.IO: Utilisateur en cours de déconnexion: ${socket.id}, Raison: ${reason}`
      );
      console.log(
        "Socket.IO: Rooms en cours de quittance:",
        Array.from(socket.rooms)
      );
    });
  });

  // Handler pour erreurs au niveau de l'instance io
  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO: Erreur de connexion au niveau du moteur:", err);
  });

  return io;
};

export default socketManager;
