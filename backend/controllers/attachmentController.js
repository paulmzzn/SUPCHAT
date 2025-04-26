import Fichier from "../models/Fichier.js";

// Récupérer les pièces jointes d'un message privé
export const getPrivateMessageAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(
      `[Attachments] Récupération des pièces jointes pour le message privé ${messageId}`
    );

    const attachments = await Fichier.getPrivateMessageAttachments(messageId);

    // Compléter les URLs des pièces jointes avec des URLs présignées si nécessaire
    const attachmentsWithUrls = attachments.map((attachment) => {
      const baseUrl =
        process.env.BASE_URL || req.protocol + "://" + req.get("host");
      return {
        ...attachment,
        presignedUrl: `${baseUrl}/api/files/${attachment.url}`,
      };
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
    res.status(500).json({ message: error.message });
  }
};
