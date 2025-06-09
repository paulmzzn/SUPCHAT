import pool from "../config/dbConnection.js";

class Search {
  // Recherche unifiée dans un workspace : canaux, utilisateurs et messages
  static async searchInWorkspace(workspaceId, searchQuery, userId, messageLimit = 100) {
    console.log(
      `[Search] Recherche pour utilisateur ${userId} dans workspace ${workspaceId} avec requête "${searchQuery}" (limite messages: ${messageLimit})`
    );

    try {
      const results = {
        canaux: [],
        utilisateurs: [],
        messages: [],
      };

      // Vérifier si les valeurs sont valides
      if (!workspaceId || !userId) {
        console.error("[Search] Erreur: workspaceId ou userId manquant");
        console.log(`workspaceId: ${workspaceId}, userId: ${userId}`);
        return results;
      }

      try {
        // Recherche de canaux (augmentation de la limite à 50)
        const canauxQuery = `
          SELECT c.* 
          FROM canal c
          WHERE c.fk_workspace = $1
          AND c.nom ILIKE $2
          ORDER BY c.nom
          LIMIT 50
        `;
        const canauxResult = await pool.query(canauxQuery, [
          workspaceId,
          `%${searchQuery}%`,
        ]);
        results.canaux = canauxResult.rows;
        console.log(`[Search] ${results.canaux.length} canaux trouvés`);
      } catch (canalError) {
        console.error("[Search] Erreur recherche canaux:", canalError);
        results.canaux = [];
      }

      try {
        // Recherche d'utilisateurs dans ce workspace (augmentation de la limite à 50)
        const utilisateursQuery = `
          SELECT u.id_utilisateur, u.nom, u.email, u.photo_de_profil
          FROM utilisateur u
          JOIN membre_workspace mw ON u.id_utilisateur = mw.fk_utilisateur
          WHERE mw.fk_workspace = $1
          AND (
            u.nom ILIKE $2
            OR u.email ILIKE $2
          )
          ORDER BY u.nom
          LIMIT 50
        `;
        const utilisateursResult = await pool.query(utilisateursQuery, [
          workspaceId,
          `%${searchQuery}%`,
        ]);
        results.utilisateurs = utilisateursResult.rows;
        console.log(
          `[Search] ${results.utilisateurs.length} utilisateurs trouvés`
        );
      } catch (userError) {
        console.error("[Search] Erreur recherche utilisateurs:", userError);
        results.utilisateurs = [];
      }

      try {
        // Recherche de messages dans tous les canaux du workspace
        // Modification pour supprimer la référence à la table membre_canal qui n'existe pas
        const messagesQuery = `
          SELECT m.id_message, m.contenu, m.created_at as date_creation, 
                c.id_canal, c.nom as nom_canal, 
                u.id_utilisateur, u.nom as nom_utilisateur, u.photo_de_profil
          FROM message m
          JOIN canal c ON m.fk_canal = c.id_canal
          JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
          WHERE c.fk_workspace = $1
          AND (
            m.contenu ILIKE $2
            OR u.nom ILIKE $2
          )
          ORDER BY m.created_at DESC
          LIMIT $3
        `;

        const messagesResult = await pool.query(messagesQuery, [
          workspaceId,
          `%${searchQuery}%`,
          messageLimit
        ]);
        results.messages = messagesResult.rows;
        console.log(`[Search] ${results.messages.length} messages trouvés`);
      } catch (msgError) {
        console.error("[Search] Erreur recherche messages:", msgError);
        results.messages = [];
      }

      return results;
    } catch (error) {
      console.error("Erreur dans Search.searchInWorkspace:", error);
      // Retourner un résultat vide plutôt que de propager l'erreur
      return {
        canaux: [],
        utilisateurs: [],
        messages: [],
      };
    }
  }

  // Méthode pour rechercher les messages dans un canal spécifique
  static async searchInCanal(canalId, searchQuery, userId) {
    console.log(
      `[Search] Recherche pour utilisateur ${userId} dans canal ${canalId} avec requête "${searchQuery}"`
    );

    try {
      // Recherche de messages dans un canal spécifique
      const messagesQuery = `
        SELECT m.id_message, m.contenu, m.created_at as date_creation, 
              c.id_canal, c.nom as nom_canal, 
              u.id_utilisateur, u.nom as nom_utilisateur, u.photo_de_profil
        FROM message m
        JOIN canal c ON m.fk_canal = c.id_canal
        JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
        WHERE c.id_canal = $1
        AND m.contenu ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT 50
      `;

      const messagesResult = await pool.query(messagesQuery, [
        canalId,
        `%${searchQuery}%`,
      ]);

      console.log(
        `[Search] ${messagesResult.rows.length} messages trouvés dans le canal`
      );
      return messagesResult.rows;
    } catch (error) {
      console.error("Erreur dans Search.searchInCanal:", error);
      return [];
    }
  }
}

export default Search;
