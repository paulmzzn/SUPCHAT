import Fichier from "../models/Fichier.js";
import { getS3Config } from "../config/secrets.js";

// Récupérer les pièces jointes d'un message privé
export const getPrivateMessageAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(
      `[Attachments] Récupération des pièces jointes pour le message privé ${messageId}`
    );

    const attachments = await Fichier.getPrivateMessageAttachments(messageId);

    // Nettoyer et normaliser les URLs des attachments
    const attachmentsWithUrls = attachments.map((attachment) => {
      let cleanUrl = attachment.url || "";

      // Nettoyer les URLs dupliquées
      if (
        cleanUrl.includes("https://s3.fr-par.scw.cloud/s3-supchat/https://")
      ) {
        cleanUrl = cleanUrl.substring(cleanUrl.lastIndexOf("https://"));
        console.log(
          `[Attachments] URL nettoyée (duplication détectée): ${cleanUrl}`
        );
      } else if (
        cleanUrl.includes("https://s3-supchat.s3.fr-par.scw.cloud/https://")
      ) {
        cleanUrl = cleanUrl.substring(cleanUrl.lastIndexOf("https://"));
        console.log(
          `[Attachments] URL nettoyée (duplication détectée): ${cleanUrl}`
        );
      }

      // Si l'URL est déjà complète, la retourner telle quelle
      if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
        return { ...attachment, url: cleanUrl };
      }

      // Si ce n'est qu'une clé S3, construire l'URL complète
      const s3Config = getS3Config();
      const s3Base = `${s3Config.endpoint.replace(/\/$/, "")}/${
        s3Config.bucketName
      }`;
      if (cleanUrl) {
        const fullUrl = cleanUrl.startsWith("/")
          ? `${s3Base}${cleanUrl}`
          : `${s3Base}/${cleanUrl}`;
        console.log(`[Attachments] URL construite: ${fullUrl}`);
        return { ...attachment, url: fullUrl };
      }

      return attachment;
    });

    console.log(
      `[Attachments] ${attachmentsWithUrls.length} pièces jointes trouvées`
    );
    res.status(200).json(attachmentsWithUrls);
  } catch (error) {
    console.error(
      "[Attachments] Erreur lors de la récupération des pièces jointes:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des pièces jointes",
      error: error.message,
    });
  }
};
