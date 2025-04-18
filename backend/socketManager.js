import MessageModel from "./models/Message.js";
import UserModel from "./models/User.js"; // Assurez-vous que UserModel est importé
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_USER_ID =
  process.env.MISTRAL_USER_ID || "00000000-0000-0000-0000-000000000001"; // ID du bot Mistral standard
const MISTRAL_BOT_NAME = "Mistral AI";
// --- Nouveau pour OCR ---
const MISTRAL_OCR_USER_ID =
  process.env.MISTRAL_OCR_USER_ID || "00000000-0000-0000-0000-000000000002"; // ID spécifique pour le bot OCR
const MISTRAL_OCR_BOT_NAME = "MistralOCR";
const MISTRAL_OCR_MODEL = "mistral-ocr-latest"; // Modèle OCR
// --- Fin Nouveau pour OCR ---

const setupSocketIO = (io) => {
  io.use(async (socket, next) => {
    // ... (code d'authentification existant) ...
  });

  io.on("connection", (socket) => {
    console.log(`Utilisateur connecté: ${socket.user.id} (${socket.id})`);

    // Mettre à jour le statut de l'utilisateur à 'en ligne' (si nécessaire)
    UserModel.updateStatus(socket.user.id, 1) // 1 pour 'en ligne'
      .then(() =>
        console.log(`Statut mis à jour pour ${socket.user.id}: en ligne`)
      )
      .catch((err) =>
        console.error("Erreur mise à jour statut (connexion):", err)
      );

    socket.on("joinCanal", ({ canalId, workspaceId }) => {
      // ... (code existant pour rejoindre un canal) ...
    });

    socket.on("message", async (messageData) => {
      try {
        console.log("Message reçu du client:", messageData);
        const userId = socket.user.id; // Assurez-vous que l'ID utilisateur est bien dans socket.user

        // Vérifier si le message est une mention pour Mistral AI standard
        if (
          messageData.contenu &&
          messageData.contenu.startsWith(`@${MISTRAL_BOT_NAME}`)
        ) {
          console.log("Mention Mistral AI détectée");
          const userPrompt = messageData.contenu
            .substring(`@${MISTRAL_BOT_NAME}`.length)
            .trim();
          const canalId = messageData.fk_canal;

          // 1. Sauvegarder le message de l'utilisateur
          const userMessage = await MessageModel.create({
            ...messageData,
            fk_utilisateur: userId,
          });
          const fullUserMessage = await MessageModel.getById(
            userMessage.id_message
          );
          io.to(`${canalId}`).emit("message", fullUserMessage); // Diffuser le message de l'utilisateur

          // 2. Envoyer l'indicateur de frappe
          io.to(`${canalId}`).emit("typing", {
            userId: MISTRAL_USER_ID,
            userName: MISTRAL_BOT_NAME,
          });

          // 3. Appeler l'API Mistral standard
          try {
            const response = await axios.post(
              MISTRAL_API_URL,
              {
                model: "mistral-large-latest", // ou un autre modèle approprié
                messages: [{ role: "user", content: userPrompt }],
                // safe_prompt: true // Optionnel
              },
              {
                headers: {
                  Authorization: `Bearer ${MISTRAL_API_KEY}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                timeout: 60000, // Timeout de 60 secondes
              }
            );

            const botResponseContent = response.data.choices[0].message.content;

            // 4. Arrêter l'indicateur de frappe
            io.to(`${canalId}`).emit("stopTyping", { userId: MISTRAL_USER_ID });

            // 5. Sauvegarder la réponse du bot
            const botMessage = await MessageModel.create({
              contenu: botResponseContent,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_USER_ID, // Utiliser l'ID du bot
              parent_id: userMessage.id_message, // Répondre au message de l'utilisateur
            });

            // 6. Récupérer et diffuser la réponse complète du bot
            const fullBotMessage = await MessageModel.getById(
              botMessage.id_message
            );
            io.to(`${canalId}`).emit("message", fullBotMessage);
          } catch (apiError) {
            console.error("Erreur API Mistral:", apiError.message);
            io.to(`${canalId}`).emit("stopTyping", { userId: MISTRAL_USER_ID });
            // Envoyer un message d'erreur dans le chat
            const errorMessage = await MessageModel.create({
              contenu: `Désolé, je n'ai pas pu traiter votre demande. Erreur: ${
                apiError.response?.data?.message || apiError.message
              }`,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_USER_ID,
              parent_id: userMessage.id_message,
            });
            const fullErrorMessage = await MessageModel.getById(
              errorMessage.id_message
            );
            io.to(`${canalId}`).emit("message", fullErrorMessage);
          }
        }
        // --- Nouveau : Gérer la mention pour Mistral OCR ---
        else if (
          messageData.contenu &&
          messageData.contenu.startsWith(`@${MISTRAL_OCR_BOT_NAME}`)
        ) {
          console.log("Mention Mistral OCR détectée");
          const userPrompt = messageData.contenu
            .substring(`@${MISTRAL_OCR_BOT_NAME}`.length)
            .trim();
          const canalId = messageData.fk_canal;
          const parentId = messageData.parent_id; // ID du message auquel on répond

          // 1. Sauvegarder le message de l'utilisateur demandant l'OCR
          const userOcrRequestMessage = await MessageModel.create({
            ...messageData,
            fk_utilisateur: userId,
          });
          const fullUserOcrRequestMessage = await MessageModel.getById(
            userOcrRequestMessage.id_message
          );
          io.to(`${canalId}`).emit("message", fullUserOcrRequestMessage);

          // 2. Vérifier si c'est une réponse et récupérer le message parent
          if (!parentId) {
            // Envoyer un message d'erreur si ce n'est pas une réponse
            const errorReply = await MessageModel.create({
              contenu: `Pour utiliser l'OCR, veuillez répondre au message contenant le fichier PDF ou image que vous souhaitez analyser.`,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_OCR_USER_ID,
              parent_id: userOcrRequestMessage.id_message, // Répondre à la demande de l'utilisateur
            });
            const fullErrorReply = await MessageModel.getById(
              errorReply.id_message
            );
            io.to(`${canalId}`).emit("message", fullErrorReply);
            return; // Arrêter le traitement
          }

          const parentMessage = await MessageModel.getById(parentId);

          // 3. Vérifier si le message parent contient un fichier compatible
          if (!parentMessage || !parentMessage.file_url) {
            const errorReply = await MessageModel.create({
              contenu: `Le message auquel vous répondez ne semble pas contenir de fichier à analyser.`,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_OCR_USER_ID,
              parent_id: userOcrRequestMessage.id_message,
            });
            const fullErrorReply = await MessageModel.getById(
              errorReply.id_message
            );
            io.to(`${canalId}`).emit("message", fullErrorReply);
            return;
          }

          // Vérification simple du type (peut être affinée)
          const isImage = parentMessage.file_type?.startsWith("image/");
          const isPdf = parentMessage.file_type === "application/pdf";

          if (!isImage && !isPdf) {
            const errorReply = await MessageModel.create({
              contenu: `Je ne peux analyser que les fichiers PDF et les images pour le moment.`,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_OCR_USER_ID,
              parent_id: userOcrRequestMessage.id_message,
            });
            const fullErrorReply = await MessageModel.getById(
              errorReply.id_message
            );
            io.to(`${canalId}`).emit("message", fullErrorReply);
            return;
          }

          // 4. Envoyer l'indicateur de frappe OCR
          io.to(`${canalId}`).emit("typing", {
            userId: MISTRAL_OCR_USER_ID,
            userName: MISTRAL_OCR_BOT_NAME,
          });

          // 5. Appeler l'API Mistral OCR
          try {
            const ocrPayload = {
              model: MISTRAL_OCR_MODEL,
              messages: [
                {
                  role: "user",
                  content: [
                    // Fournir l'URL de l'image/PDF
                    {
                      type: isImage ? "image_url" : "document_url", // Ajuster le type si nécessaire basé sur l'API Mistral
                      [isImage ? "image_url" : "document_url"]: {
                        url: parentMessage.file_url,
                      },
                    },
                    // Fournir la requête textuelle de l'utilisateur
                    {
                      type: "text",
                      text: userPrompt || "Analyse ce document.",
                    }, // Prompt par défaut si vide
                  ],
                },
              ],
            };

            console.log("Payload OCR:", JSON.stringify(ocrPayload, null, 2));

            const response = await axios.post(MISTRAL_API_URL, ocrPayload, {
              headers: {
                Authorization: `Bearer ${MISTRAL_API_KEY}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              timeout: 120000, // Timeout plus long pour l'OCR (120 secondes)
            });

            const ocrResponseContent = response.data.choices[0].message.content;

            // 6. Arrêter l'indicateur de frappe OCR
            io.to(`${canalId}`).emit("stopTyping", {
              userId: MISTRAL_OCR_USER_ID,
            });

            // 7. Sauvegarder la réponse OCR
            const ocrBotMessage = await MessageModel.create({
              contenu: ocrResponseContent,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_OCR_USER_ID, // Utiliser l'ID du bot OCR
              parent_id: userOcrRequestMessage.id_message, // Répondre à la demande de l'utilisateur
            });

            // 8. Récupérer et diffuser la réponse complète du bot OCR
            const fullOcrBotMessage = await MessageModel.getById(
              ocrBotMessage.id_message
            );
            io.to(`${canalId}`).emit("message", fullOcrBotMessage);
          } catch (apiError) {
            console.error("Erreur API Mistral OCR:", apiError.message);
            io.to(`${canalId}`).emit("stopTyping", {
              userId: MISTRAL_OCR_USER_ID,
            });
            // Envoyer un message d'erreur dans le chat
            const errorMessage = await MessageModel.create({
              contenu: `Désolé, je n'ai pas pu analyser le fichier. Erreur: ${
                apiError.response?.data?.message || apiError.message
              }`,
              fk_canal: canalId,
              fk_utilisateur: MISTRAL_OCR_USER_ID,
              parent_id: userOcrRequestMessage.id_message,
            });
            const fullErrorMessage = await MessageModel.getById(
              errorMessage.id_message
            );
            io.to(`${canalId}`).emit("message", fullErrorMessage);
          }
        }
        // --- Fin : Gérer la mention pour Mistral OCR ---
        // Si ce n'est pas une mention spéciale, traiter comme un message normal
        else {
          const newMessage = await MessageModel.create({
            ...messageData,
            fk_utilisateur: userId,
          });
          const fullMessage = await MessageModel.getById(newMessage.id_message);
          console.log("Message normal sauvegardé et diffusé:", fullMessage);
          io.to(`${messageData.fk_canal}`).emit("message", fullMessage);
        }
      } catch (error) {
        console.error("Erreur lors de la gestion du message:", error);
        // Envoyer une notification d'erreur à l'utilisateur qui a envoyé le message ?
        socket.emit("messageError", {
          message: "Erreur lors de l'envoi du message.",
          error: error.message,
        });
      }
    });

    socket.on("addReaction", async ({ messageId, reaction_type, canalId }) => {
      try {
        const userId = socket.user.id;
        console.log(
          `Ajout réaction: user=${userId}, msg=${messageId}, type=${reaction_type}, canal=${canalId}`
        );

        // 1. Ajouter la réaction dans la base de données
        // Assurez-vous que MessageModel.addReaction gère l'ajout ou l'incrémentation
        await MessageModel.addReaction(messageId, userId, reaction_type);

        // 2. Récupérer le message mis à jour avec toutes les réactions groupées
        const updatedMessage = await MessageModel.getById(messageId);
        if (!updatedMessage) {
          console.error(
            `Message ${messageId} non trouvé après ajout réaction.`
          );
          return;
        }

        // 3. Diffuser la mise à jour des réactions à tous dans le canal
        io.to(`${canalId}`).emit("messageReaction", {
          messageId: messageId,
          reactions: updatedMessage.reactions || [], // Envoyer le tableau complet des réactions
        });
        console.log(`Réaction ajoutée et diffusée pour msg ${messageId}`);
      } catch (error) {
        console.error("Erreur lors de l'ajout de la réaction:", error);
        socket.emit("reactionError", { messageId, error: error.message });
      }
    });

    socket.on(
      "removeReaction",
      async ({ messageId, reaction_type, canalId }) => {
        try {
          const userId = socket.user.id;
          console.log(
            `Suppression réaction: user=${userId}, msg=${messageId}, type=${reaction_type}, canal=${canalId}`
          );

          // 1. Supprimer la réaction dans la base de données
          // Assurez-vous que MessageModel.removeReaction gère la suppression ou la décrémentation
          await MessageModel.removeReaction(messageId, userId, reaction_type);

          // 2. Récupérer le message mis à jour avec toutes les réactions groupées
          const updatedMessage = await MessageModel.getById(messageId);
          if (!updatedMessage) {
            // Si le message n'existe plus (rare), on ne fait rien de plus
            console.warn(
              `Message ${messageId} non trouvé après suppression réaction.`
            );
            // On pourrait envoyer un événement spécial si nécessaire, mais souvent on ignore
            return;
          }

          // 3. Diffuser la mise à jour des réactions à tous dans le canal
          io.to(`${canalId}`).emit("messageReaction", {
            messageId: messageId,
            reactions: updatedMessage.reactions || [], // Envoyer le tableau complet des réactions
          });
          console.log(`Réaction supprimée et diffusée pour msg ${messageId}`);
        } catch (error) {
          console.error("Erreur lors de la suppression de la réaction:", error);
          socket.emit("reactionError", { messageId, error: error.message });
        }
      }
    );

    socket.on("deleteMessage", async ({ messageId, canalId, workspaceId }) => {
      try {
        const userId = socket.user.id;
        console.log(
          `Tentative de suppression message: user=${userId}, msg=${messageId}, canal=${canalId}`
        );

        // 1. Vérifier si l'utilisateur est autorisé à supprimer (optionnel mais recommandé)
        const message = await MessageModel.getByIdSimple(messageId); // Méthode simple sans jointures
        if (!message) {
          console.warn(`Message ${messageId} non trouvé pour suppression.`);
          return; // Message déjà supprimé ou inexistant
        }
        if (message.fk_utilisateur !== userId) {
          // Ici, vous pourriez vérifier si l'utilisateur est admin/owner du workspace
          // Pour l'instant, on suppose que seuls les auteurs peuvent supprimer
          console.warn(
            `Utilisateur ${userId} non autorisé à supprimer le message ${messageId}`
          );
          socket.emit("deleteMessageError", {
            messageId,
            error: "Non autorisé",
          });
          return;
        }

        // 2. Supprimer le message dans la base de données (déjà fait via API REST normalement, mais on peut le refaire ici par sécurité ou si l'API n'est pas utilisée)
        // await MessageModel.delete(messageId); // Décommentez si la suppression via socket est la source principale

        // 3. Diffuser l'événement de suppression aux autres utilisateurs dans le canal
        // L'événement est émis par le client qui a initié la suppression via l'API REST,
        // mais on peut le re-diffuser ici si nécessaire (attention aux boucles).
        // Normalement, le client qui supprime reçoit la confirmation de l'API et met à jour son UI.
        // Les autres clients reçoivent l'événement 'messageDeleted' (ou 'deleteMessage') émis par le client initiateur ou par le serveur après confirmation API.
        // Si le serveur doit être la source de vérité unique pour la diffusion :
        console.log(
          `Diffusion de la suppression du message ${messageId} au canal ${canalId}`
        );
        io.to(`${canalId}`).emit("messageDeleted", { messageId }); // Utiliser 'messageDeleted' pour la cohérence avec le frontend
      } catch (error) {
        console.error(
          "Erreur lors de la gestion de la suppression du message via socket:",
          error
        );
        socket.emit("deleteMessageError", { messageId, error: error.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Utilisateur déconnecté: ${socket.user.id} (${socket.id}). Raison: ${reason}`
      );
      // Mettre à jour le statut de l'utilisateur à 'hors ligne'
      UserModel.updateStatus(socket.user.id, 0) // 0 pour 'hors ligne'
        .then(() =>
          console.log(`Statut mis à jour pour ${socket.user.id}: hors ligne`)
        )
        .catch((err) =>
          console.error("Erreur mise à jour statut (déconnexion):", err)
        );

      // Optionnel: Diffuser le statut hors ligne aux autres utilisateurs
      // Vous devrez déterminer quels workspaces/canaux informer.
      // Exemple simple:
      // io.emit('userStatusUpdate', { userId: socket.user.id, status: 'offline' });
    });
  });
};

export default setupSocketIO;
