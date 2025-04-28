import Fichier from "../models/Fichier.js";

// Récupérer les pièces jointes d'un message privé
export const getPrivateMessageAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(
      `[Attachments] Récupération des pièces jointes pour le message privé ${messageId}`
    );

    const attachments = await Fichier.getPrivateMessageAttachments(messageId);

    // Correction : ne pas préfixer si déjà une URL S3
    const attachmentsWithUrls = attachments.map((attachment) => {
      if (attachment.url && attachment.url.startsWith("http")) {
        return attachment;
      }
      // Sinon, préfixer avec l'URL S3 si possible, sinon garder l'URL brute
      const s3Base =
        process.env.SCW_ENDPOINT && process.env.S3_BUCKET_NAME
          ? `${process.env.SCW_ENDPOINT.replace(/\/$/, "")}/${
              process.env.S3_BUCKET_NAME
            }`
          : null;
      if (s3Base && attachment.url) {
        return { ...attachment, url: `${s3Base}/${attachment.url}` };
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
