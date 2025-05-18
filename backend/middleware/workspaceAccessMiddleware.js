import pool from "../config/db.js";

/**
 * @author GAULT Rudy
 * @company Cloud Temple
 * @created_at 2025-05-17 14:59:30
 * @updated_by GAULT Rudy
 * @updated_at 2025-05-17 15:30:45
 */
export const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let workspaceId = req.params.workspaceId || req.body.workspaceId;

    // Si nous avons un canalId mais pas de workspaceId, rechercher le workspace associé
    if (!workspaceId && (req.params.canalId || req.body.canalId)) {
      const canalId = req.params.canalId || req.body.canalId;
      const canalQuery = await pool.query(
        "SELECT workspace_id FROM canals WHERE id = $1",
        [canalId]
      );

      if (canalQuery.rows.length === 0) {
        return res.status(404).json({ message: "Canal non trouvé" });
      }

      workspaceId = canalQuery.rows[0].workspace_id;
    }

    if (!workspaceId) {
      return next(); // Pas de workspaceId trouvé, donc on continue
    }

    // Vérifier si le workspace existe et s'il est privé
    const workspaceQuery = await pool.query(
      "SELECT is_private FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    if (workspaceQuery.rows.length === 0) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    const workspace = workspaceQuery.rows[0];

    // Si le workspace n'est pas privé, on autorise l'accès
    if (!workspace.is_private) {
      return next();
    }

    // Si le workspace est privé, vérifier si l'utilisateur en est membre
    const membershipQuery = await pool.query(
      "SELECT * FROM membre_workspace WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, userId]
    );

    if (membershipQuery.rows.length === 0) {
      return res.status(403).json({
        message:
          "Ce workspace est privé et vous n'êtes pas autorisé à y accéder",
      });
    }

    // L'utilisateur est membre du workspace privé, autoriser l'accès
    next();
  } catch (error) {
    console.error("Erreur de vérification d'accès au workspace:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
