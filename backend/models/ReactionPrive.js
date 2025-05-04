import pool from '../config/dbConnection.js';

class ReactionPrive {
	// Créer une réaction
	static async create({ fk_message_prive, fk_utilisateur, reaction_type }) {
		try {
			const result = await pool.query(
				`INSERT INTO private_message_reaction (fk_message_prive, fk_utilisateur, reaction_type, created_at)
				 VALUES ($1, $2, $3, NOW())
				 RETURNING *`,
				[fk_message_prive, fk_utilisateur, reaction_type]
			);
			return result.rows[0];
		} catch (error) {
			console.error('Erreur dans ReactionPrive.create:', error);
			throw error;
		}
	}

	// Supprimer une réaction
	static async delete(fk_message_prive, fk_utilisateur, reaction_type) {
		try {
			const result = await pool.query(
				`DELETE FROM private_message_reaction 
				 WHERE fk_message_prive = $1 AND fk_utilisateur = $2 AND reaction_type = $3
				 RETURNING *`,
				[fk_message_prive, fk_utilisateur, reaction_type]
			);
			return result.rows[0];
		} catch (error) {
			console.error('Erreur dans ReactionPrive.delete:', error);
			throw error;
		}
	}

	// Récupérer les réactions d'un message privé
	static async getByMessage(messagePriveId, userId = null) {
		try {
			let query, params;
			if (userId) {
				query = `
					SELECT reaction_type, COUNT(*) as count, 
						CASE WHEN SUM(CASE WHEN fk_utilisateur = $1 THEN 1 ELSE 0 END) > 0 
						THEN true ELSE false END as user_reacted
					FROM private_message_reaction
					WHERE fk_message_prive = $2
					GROUP BY reaction_type
					ORDER BY count DESC
				`;
				params = [userId, messagePriveId];
			} else {
				query = `
					SELECT reaction_type, COUNT(*) as count,
						false as user_reacted
					FROM private_message_reaction
					WHERE fk_message_prive = $1
					GROUP BY reaction_type
					ORDER BY count DESC
				`;
				params = [messagePriveId];
			}
			const result = await pool.query(query, params);
			return result.rows;
		} catch (error) {
			console.error('Erreur dans ReactionPrive.getByMessage:', error);
			return [];
		}
	}

	// Récupérer les réactions pour plusieurs messages privés
	static async getByMessages(messagePriveIds) {
		try {
			if (!messagePriveIds.length) return {};
			const result = await pool.query(
				`SELECT fk_message_prive, reaction_type, COUNT(*) as count
				 FROM private_message_reaction
				 WHERE fk_message_prive = ANY($1)
				 GROUP BY fk_message_prive, reaction_type
				 ORDER BY fk_message_prive, count DESC`,
				[messagePriveIds]
			);
			const reactionsMap = {};
			result.rows.forEach(row => {
				if (!reactionsMap[row.fk_message_prive]) {
					reactionsMap[row.fk_message_prive] = [];
				}
				reactionsMap[row.fk_message_prive].push({
					reaction_type: row.reaction_type,
					count: parseInt(row.count),
					user_reacted: false
				});
			});
			return reactionsMap;
		} catch (error) {
			console.error('Erreur dans ReactionPrive.getByMessages:', error);
			return {};
		}
	}
}

export default ReactionPrive;