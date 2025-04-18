import MessageModel from "../models/Message.js";
import FichierModel from "../models/Fichier.js"; // Importer le nouveau modèle Fichier
import MessageFichierModel from "../models/MessageFichier.js"; // Importer le nouveau modèle MessageFichier
import { uploadToS3, deleteFromS3 } from "../config/s3Config.js"; // Assurez-vous que uploadToS3 et deleteFromS3 sont importés
import Canal from "../models/Canal.js"; // Assurez-vous que Canal est importé si vous l'utilisez ailleurs

// Créer un nouveau message
export const createMessage = async (req, res) => {
  try {
    const { fk_canal, contenu, parent_id } = req.body;
    const userId = req.user.id; // Récupéré du middleware auth

    console.log("Création de message:", {
      userId,
      fk_canal,
      contenu,
      parent_id,
    });

    // Vérifier que le canal existe
    const canal = await Canal.findById(fk_canal);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    // Si parent_id est spécifié, vérifier que le message parent existe
    if (parent_id) {
      const parentMessage = await MessageModel.getById(parent_id);
      if (!parentMessage) {
        return res.status(404).json({ message: "Message parent non trouvé" });
      }
    }

    const message = await MessageModel.create({
      contenu,
      fk_canal,
      fk_utilisateur: userId,
      parent_id,
    });

    // Récupérer les informations complètes pour socket.io
    const fullMessage = await MessageModel.getById(message.id_message);
    console.log("Message créé avec succès:", fullMessage);

    // Émettre le message via socket.io
    const io = req.app.get("io");
    if (io) {
      console.log(`Émission du message vers canal ${fk_canal}`);
      io.to(`${fk_canal}`).emit("message", fullMessage);
    } else {
      console.warn("Instance Socket.IO non disponible");
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error("Erreur lors de la création du message:", error);
    res.status(500).json({
      message: error.message || "Erreur lors de la création du message",
    });
  }
};

// Récupérer les messages d'un canal
export const getMessagesByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`Récupération des messages pour canal ${channelId}`);

    // Vérifier que le canal existe
    const canal = await Canal.findById(channelId);
    if (!canal) {
      console.log("Canal non trouvé:", channelId);
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    const messages = await MessageModel.findByChannel(channelId);
    console.log(`${messages.length} messages trouvés`);

    // Normaliser les dates pour assurer la compatibilité avec le front-end
    const transformedMessages = messages.map((msg) => {
      // Si le front-end s'attend à date_creation mais la BD utilise created_at
      if (msg.created_at && !msg.date_creation) {
        msg.date_creation = msg.created_at;
      }
      return msg;
    });

    res.status(200).json(transformedMessages || []);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({
      message: error.message || "Erreur lors de la récupération des messages",
    });
  }
};

// Mettre à jour un message
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { contenu } = req.body;
    const userId = req.user.id;

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await MessageModel.getById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    if (message.fk_utilisateur !== userId) {
      return res
        .status(403)
        .json({ message: "Vous ne pouvez pas modifier ce message" });
    }

    const updatedMessage = await MessageModel.update(messageId, { contenu });

    const io = req.app.get("io");
    if (io) {
      io.to(`canal:${message.fk_canal}`).emit("updateMessage", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du message:", error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await MessageModel.getById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    if (message.fk_utilisateur !== userId) {
      return res
        .status(403)
        .json({ message: "Vous ne pouvez pas supprimer ce message" });
    }

    await MessageModel.delete(messageId);

    const io = req.app.get("io");
    if (io) {
      io.to(`canal:${message.fk_canal}`).emit("deleteMessage", {
        id: messageId,
      });
    }

    res.status(200).json({ message: "Message supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du message:", error);
    res.status(500).json({ message: error.message });
  }
};

// Contrôleur pour uploader un fichier et créer le message associé
export const uploadMessageFile = async (req, res) => {
  let messageId = null;
  let fichierId = null;
  let fileUrl = null;

  try {
    // **** LOG AJOUTÉ **** : Vérifier le corps de la requête reçu
    console.log(
      "uploadMessageFile - req.body:",
      JSON.stringify(req.body, null, 2)
    );
    // **** LOG AJOUTÉ **** : Vérifier le fichier reçu (si besoin)
    // console.log("uploadMessageFile - req.file:", req.file);

    const { canalId } = req.params;
    const userId = req.user.id;
    // Extraire contenu et parent_id du corps de la requête
    const { contenu, parent_id } = req.body;

    if (!userId) {
      console.error(
        "Erreur uploadMessageFile: ID utilisateur manquant dans req.user"
      );
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    if (!req.file) {
      console.error("Erreur uploadMessageFile: Aucun fichier reçu");
      return res.status(400).json({ message: "Aucun fichier" });
    }

    console.log(
      "Upload fichier pour canal:",
      canalId,
      "par utilisateur:",
      userId
    );
    console.log("Fichier:", req.file.originalname, "Type:", req.file.mimetype);
    // **** LOG AJOUTÉ **** : Afficher le contenu textuel reçu
    console.log("Contenu textuel reçu:", contenu);
    console.log("Parent ID reçu:", parent_id);

    // 1. Upload vers S3
    fileUrl = await uploadToS3(req.file, `messages/${canalId}/files`);
    console.log("Fichier uploadé sur S3:", fileUrl);

    // 2. Créer l'entrée dans la table 'fichier'
    const fichierData = {
      nom_fichier: req.file.originalname,
      url: fileUrl,
      type: req.file.mimetype,
    };
    const fichierCree = await FichierModel.create(fichierData);
    fichierId = fichierCree.id_fichier;
    console.log("Entrée Fichier créée en BDD:", fichierCree);

    // 3. Créer l'entrée dans la table 'message'
    const messageData = {
      fk_canal: canalId,
      fk_utilisateur: userId,
      contenu: contenu || null, // Utilise le contenu extrait
      parent_id: parent_id || null,
    };
    // **** LOG AJOUTÉ **** : Vérifier les données envoyées au modèle Message
    console.log(
      "Données pour MessageModel.create:",
      JSON.stringify(messageData, null, 2)
    );

    const messageMinimal = await MessageModel.create(messageData);
    messageId = messageMinimal.id_message;
    console.log("Entrée Message créée en BDD (minimal):", messageMinimal);

    // 4. Lier le message et le fichier dans 'message_fichier'
    await MessageFichierModel.link(messageId, fichierId);
    console.log(
      `Liaison Message (${messageId}) <-> Fichier (${fichierId}) créée.`
    );

    // 5. Récupérer le message complet (avec jointures utilisateur ET fichier)
    // **** IMPORTANT **** : Assurez-vous que MessageModel.getById effectue une jointure
    //                     pour inclure les informations du fichier associé (url, nom_fichier, type).
    const messageComplet = await MessageModel.getById(messageId);
    if (!messageComplet) {
      console.error(
        `Erreur critique: Impossible de récupérer le message complet ${messageId} après création et liaison.`
      );
      // Tenter de supprimer le fichier S3 car l'opération a échoué
      if (fileUrl) {
        try {
          await deleteFromS3(fileUrl);
          console.log(
            `Nettoyage: Fichier S3 ${fileUrl} supprimé suite à l'échec de récupération du message.`
          );
        } catch (deleteError) {
          console.error(
            `Nettoyage: Échec de la suppression du fichier S3 ${fileUrl}:`,
            deleteError
          );
        }
      }
      throw new Error(
        "Impossible de récupérer le message complet après création."
      );
    }
    console.log(
      "Message complet récupéré (AVANT émission/réponse):",
      JSON.stringify(messageComplet, null, 2)
    );

    // 6. Émettre via Socket.IO
    const io = req.app.get("io");
    if (io) {
      console.log(`Émission du message (fichier) vers canal ${canalId}`);
      io.to(`${canalId}`).emit("message", messageComplet);
    } else {
      console.warn("Instance Socket.IO non disponible.");
    }

    // 7. Renvoyer la réponse
    res.status(201).json(messageComplet);
  } catch (err) {
    console.error("Erreur DÉTAILLÉE lors de l'upload du fichier message:", err);
    console.error("Stack:", err.stack);

    // Tentative de nettoyage en cas d'erreur
    if (fileUrl && !messageId) {
      console.warn(
        `Tentative de suppression du fichier S3 ${fileUrl} suite à une erreur avant création message...`
      );
      try {
        await deleteFromS3(fileUrl);
        console.log(`Fichier S3 ${fileUrl} supprimé avec succès.`);
      } catch (deleteError) {
        console.error(
          `Échec de la suppression du fichier S3 ${fileUrl}:`,
          deleteError
        );
      }
    }

    res.status(500).json({
      message: err.message || "Erreur serveur lors de l'upload du fichier.",
      error: err.message,
    });
  }
};
