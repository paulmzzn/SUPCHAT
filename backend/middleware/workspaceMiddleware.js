import pool from "../config/dbConnection.js";

// Middleware pour vérifier si l'utilisateur est membre du workspace
export const checkWorkspaceMembership = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user?.id;

    // Si pas d'ID utilisateur, refuser l'accès
    if (!userId) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Vérifier si le workspace existe et s'il est privé
    const workspaceResult = await pool.query(
      "SELECT * FROM workspace WHERE id_workspace = $1",
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    const workspace = workspaceResult.rows[0];

    // Si le workspace est public, autoriser l'accès
    if (!workspace.is_private) {
      return next();
    }

    // Si le workspace est privé, vérifier si l'utilisateur est membre
    const membershipResult = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({
        message: "Vous n'avez pas accès à ce workspace privé",
      });
    }

    // L'utilisateur est membre, autoriser l'accès
    next();
  } catch (error) {
    console.error(
      "Erreur dans le middleware de vérification de membership:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Middleware pour vérifier si l'utilisateur a accès à un canal spécifique
export const checkChannelAccess = async (req, res, next) => {
  try {
    const channelId = req.params.channelId || req.params.canalId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (!channelId) {
      return res.status(400).json({ message: "ID de canal manquant" });
    }

    // Récupérer le canal et son workspace
    const channelResult = await pool.query(
      "SELECT c.*, w.is_private FROM canal c JOIN workspace w ON c.fk_workspace = w.id_workspace WHERE c.id_canal = $1",
      [channelId]
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    const channel = channelResult.rows[0];
    const workspaceId = channel.fk_workspace;

    // Si le workspace n'est pas privé et que le canal n'est pas privé, autoriser l'accès
    if (!channel.is_private && !channel.w_is_private) {
      return next();
    }

    // Vérifier si l'utilisateur est membre du workspace
    const membershipResult = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({
        message: "Vous n'êtes pas membre de ce workspace",
      });
    }

    // Tout est bon, l'utilisateur peut accéder au canal
    next();
  } catch (error) {
    console.error(
      "Erreur dans le middleware de vérification d'accès au canal:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};
