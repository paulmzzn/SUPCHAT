import MessageModel from "../models/Message.js";
import Canal from "../models/Canal.js";
import Fichier from "../models/Fichier.js";
import { uploadToS3 } from "../config/s3Config.js";
import pool from "../config/dbConnection.js"; // Ajout de l'import manquant

// Créer un nouveau message
export const createMessage = async (req, res) => {
  try {
    const { fk_canal, contenu, parent_id, attachments } = req.body;
    const userId = req.user.id; // Récupéré du middleware auth

    console.log("Création de message:", {
      userId,
      fk_canal,
      contenu,
      parent_id,
      attachments,
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

    // Si des pièces jointes sont spécifiées, les associer au message
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const attachmentId of attachments) {
        try {
          await Fichier.addToMessage(message.id_message, attachmentId);
        } catch (attachmentError) {
          console.error(
            `Erreur lors de l'ajout de la pièce jointe ${attachmentId}:`,
            attachmentError
          );
          // Continuer malgré l'erreur
        }
      }
    }

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
    const userId = req.user.id; // L'ID de l'utilisateur connecté
    // Pagination : limit et offset (par défaut 20, 0)
    let limit = parseInt(req.query.limit, 10);
    let offset = parseInt(req.query.offset, 10);
    if (isNaN(limit) || limit <= 0) limit = 20;
    if (isNaN(offset) || offset < 0) offset = 0;

    if (!channelId) {
      console.error("getMessagesByChannel: ID de canal manquant", { 
        params: req.params, 
        url: req.originalUrl 
      });
      return res.status(400).json({ 
        message: "ID de canal non fourni.",
        error: "CHANNEL_ID_MISSING",
        params: req.params
      });
    }

    console.log(`Récupération des messages pour canal ${channelId} par utilisateur ${userId} (limit=${limit}, offset=${offset})`);

    // Vérifier que le canal existe
    const canal = await Canal.findById(channelId);
    if (!canal) {
      console.log("Canal non trouvé:", channelId);
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    // NOUVELLE VERIFICATION: Vérifier que l'utilisateur a le droit de lecture sur ce canal
    const accessCheck = await Canal.checkUserAccess(channelId, userId);
    if (!accessCheck.hasAccess) {
      console.log(`Utilisateur ${userId} n'a pas accès au canal ${channelId}`);
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à ce canal",
        error: "ACCESS_DENIED" 
      });
    }

    // Une fois que nous avons vérifié que l'utilisateur a accès, récupérer les messages paginés
    const messages = await MessageModel.findByChannel(channelId, limit, offset);
    console.log(`${messages.length} messages trouvés (limit=${limit}, offset=${offset})`);

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

// Récupérer un message par son ID
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await MessageModel.getById(id);

    if (!message) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Erreur lors de la récupération du message:", error);
    res.status(500).json({ message: error.message });
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

// Supprimer un message et ses pièces jointes
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id; // Correction ici
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

    // Récupérer les pièces jointes du message avant suppression
    const attachments = await Fichier.getByMessageId(messageId);

    // Supprimer d'abord les associations dans message_fichier
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          await Fichier.removeFromMessage(messageId, attachment.id_fichier);
        } catch (err) {
          console.error(
            "Erreur lors de la dissociation de la pièce jointe:",
            err
          );
        }
      }
    }

    await MessageModel.delete(messageId);

    const io = req.app.get("io");
    if (io) {
      io.to(`${message.fk_canal}`).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ message: "Message supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du message:", error);
    res.status(500).json({ message: error.message });
  }
};

// Nouvelle fonction pour gérer l'upload de fichiers
export const uploadFile = async (req, res) => {
  console.log("🚀 Début de uploadFile - serveur");
  try {
    if (!req.file) {
      console.log("❌ Aucun fichier reçu dans la requête");
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const { canalId, workspaceId, parentId } = req.body;
    const userId = req.user.id;

    console.log("📄 Détails de la requête:", {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      canalId,
      workspaceId,
      parentId: parentId || "aucun",
      userId,
    });

    console.log("🧪 Vérification de la requête multer:", {
      fileBuffer: req.file.buffer ? "Présent" : "Absent",
      fileBufferSize: req.file.buffer ? req.file.buffer.length : 0,
    });

    // Upload du fichier vers S3
    try {
      console.log("☁️ Tentative d'upload vers S3...");
      const fileKey = await uploadToS3(req.file, "messages/files");
      console.log("✅ Fichier uploadé avec succès vers S3:", fileKey);

      // Construction de l'URL complète du fichier
      const s3Endpoint =
        process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud/";
      const bucketName = process.env.S3_BUCKET_NAME || "supchat-files";
      const fullFileUrl = `${s3Endpoint}${bucketName}/${fileKey}`.replace(
        /([^:])\/\/+/g,
        "$1/"
      );

      console.log("🔗 URL complète du fichier:", fullFileUrl);

      // Créer le message avec le lien vers le fichier
      const fileUrl = fileKey;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileType = req.file.mimetype;

      // Déterminer si c'est une image
      const isImage = fileType.startsWith("image/");
      console.log(`🖼️ Est une image: ${isImage}`);

      // Créer un contenu spécial pour le message incluant les métadonnées du fichier
      const fileContent = JSON.stringify({
        type: "file",
        fileUrl,
        fileName,
        fileSize,
        fileType,
        isImage,
      });
      console.log(
        "📝 Contenu du message préparé:",
        fileContent.substring(0, 100) + "..."
      );

      console.log("💾 Préparation de l'insertion en base de données...");
      // Insérer le message dans la base de données
      const queryText = `
        INSERT INTO message (contenu, fk_utilisateur, fk_canal, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id_message, contenu, fk_canal, fk_utilisateur, created_at, parent_id
      `;

      const values = [fileContent, userId, canalId, parentId || null];
      console.log("🔍 Valeurs pour la requête SQL:", values);

      try {
        const { rows } = await pool.query(queryText, values);
        const message = rows[0];
        console.log(
          "✅ Message inséré dans la base de données:",
          message.id_message
        );

        // Récupérer les informations de l'utilisateur
        console.log("👤 Récupération des infos utilisateur...");
        const userResult = await pool.query(
          "SELECT nom, photo_de_profil FROM utilisateur WHERE id_utilisateur = $1",
          [userId]
        );

        const user = userResult.rows[0];
        console.log("👤 Infos utilisateur récupérées:", user);

        // Enrichir le message avec les informations de l'utilisateur
        const enrichedMessage = {
          ...message,
          nom: user.nom,
          photo_de_profil: user.photo_de_profil,
        };

        // Émission de l'événement via socket.io
        if (req.app.get("io")) {
          console.log("🔌 Émission du message via Socket.IO");
          const io = req.app.get("io");
          io.to(`${canalId}`).emit("message", enrichedMessage);
        } else {
          console.log("⚠️ Instance Socket.IO non disponible");
        }

        console.log("🎉 Upload réussi, envoi de la réponse au client");
        res.status(201).json(enrichedMessage);
      } catch (dbError) {
        console.error(
          "❌ Erreur lors de l'insertion en base de données:",
          dbError
        );
        throw new Error(`Erreur base de données: ${dbError.message}`);
      }
    } catch (s3Error) {
      console.error("❌ Erreur S3 détaillée:", s3Error);
      console.error("❌ Stack trace S3:", s3Error.stack);
      res.status(500).json({
        message: "Erreur lors de l'upload vers S3",
        error: s3Error.message,
      });
    }
  } catch (error) {
    console.error("❌ Erreur générale lors de l'upload:", error);
    console.error("❌ Stack trace générale:", error.stack);
    res.status(500).json({
      message: "Erreur lors de l'upload de fichier",
      error: error.message,
    });
  }
  console.log("🏁 Fin de uploadFile - serveur");
};

// Récupérer le nombre de messages non lus par canal pour un utilisateur
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Récupération des messages non lus pour l'utilisateur ${userId}`);
    
    const unreadData = await MessageModel.getUnreadCountByChannel(userId);
    
    // Pas besoin de recalculer le total, il est déjà fourni par le modèle
    res.status(200).json(unreadData);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages non lus:", error);
    res.status(500).json({ 
      message: error.message || "Erreur lors de la récupération des messages non lus" 
    });
  }
};

// Obtenir tous les messages non lus par canal pour l'utilisateur courant
export const getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: "ID utilisateur requis" });
    }

    const unreadData = await MessageModel.getUnreadCountByChannel(userId);
    
    // Pas besoin de recalculer le total, il est déjà fourni par le modèle
    res.status(200).json(unreadData);
  } catch (error) {
    console.error("Erreur dans getUnreadMessages:", error);
    res.status(500).json({ message: error.message });
  }
};

// Marquer un canal comme lu pour l'utilisateur courant
export const markChannelAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;
    
    if (!userId || !channelId) {
      return res.status(400).json({ message: "ID utilisateur et ID canal requis" });
    }

    const result = await MessageModel.markChannelAsRead(userId, channelId);
    
    // Diffuser l'événement à l'utilisateur pour mettre à jour son UI
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("channelRead", { channelId });
    }
    
    res.status(200).json({ 
      message: "Canal marqué comme lu", 
      channel: channelId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Erreur dans markChannelAsRead:", error);
    res.status(500).json({ message: error.message });
  }
};

// NOUVEAU: Obtenir les messages non lus organisés par workspace
export const getUnreadMessagesByWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: "ID utilisateur requis" });
    }

    console.log(`🏢 Récupération des messages non lus par workspace pour l'utilisateur ${userId}`);

    // Récupérer tous les workspaces de l'utilisateur avec leurs canaux non lus
    const query = `
      WITH user_workspaces AS (
        SELECT DISTINCT w.id_workspace, w.nom as workspace_name
        FROM workspace w
        JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace
        WHERE mw.fk_utilisateur = $1
      ),
      unread_by_channel AS (
        SELECT 
          c.id_canal,
          c.nom as channel_name,
          c.fk_workspace,
          COUNT(m.id_message) as unread_count
        FROM canal c
        JOIN message m ON c.id_canal = m.fk_canal
        LEFT JOIN canal_lecture cl ON c.id_canal = cl.fk_canal AND cl.fk_utilisateur = $1
        WHERE c.fk_workspace IN (SELECT id_workspace FROM user_workspaces)
          AND (cl.derniere_lecture IS NULL OR m.created_at > cl.derniere_lecture)
          AND m.fk_utilisateur != $1
        GROUP BY c.id_canal, c.nom, c.fk_workspace
        HAVING COUNT(m.id_message) > 0
      )
      SELECT 
        uw.id_workspace,
        uw.workspace_name,
        COALESCE(
          json_object_agg(
            ubc.id_canal, 
            json_build_object(
              'count', ubc.unread_count,
              'name', ubc.channel_name
            )
          ) FILTER (WHERE ubc.id_canal IS NOT NULL), 
          '{}'::json
        ) as channels,
        COALESCE(SUM(ubc.unread_count), 0) as total_unread
      FROM user_workspaces uw
      LEFT JOIN unread_by_channel ubc ON uw.id_workspace = ubc.fk_workspace
      GROUP BY uw.id_workspace, uw.workspace_name
      ORDER BY uw.workspace_name;
    `;

    const { rows } = await pool.query(query, [userId]);

    // Organiser les résultats par workspace
    const workspaces = {};
    rows.forEach(row => {
      workspaces[row.id_workspace] = {
        name: row.workspace_name,
        totalUnread: parseInt(row.total_unread),
        channels: row.channels || {}
      };
    });

    const response = {
      workspaces,
      total: Object.values(workspaces).reduce((sum, ws) => sum + ws.totalUnread, 0)
    };

    console.log(`🏢 Réponse workspace unread:`, {
      workspaceCount: Object.keys(workspaces).length,
      totalUnread: response.total
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Erreur dans getUnreadMessagesByWorkspace:", error);
    res.status(500).json({ message: error.message });
  }
};
