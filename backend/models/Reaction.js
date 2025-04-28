import pool from '../config/dbConnection.js';

class Reaction {
	// Créer une réaction
	static async create({ fk_message, fk_utilisateur, reaction_type }) {
		try {
			const result = await pool.query(
				`INSERT INTO reaction (fk_message, fk_utilisateur, reaction_type, created_at)
				 VALUES ($1, $2, $3, NOW())
				 RETURNING *`,
				[fk_message, fk_utilisateur, reaction_type]
			);
			return result.rows[0];
		} catch (error) {
			console.error('Erreur dans Reaction.create:', error);
			throw error;
		}
	}

	// Supprimer une réaction
	static async delete(fk_message, fk_utilisateur, reaction_type) {
		try {
			const result = await pool.query(
				`DELETE FROM reaction 
				 WHERE fk_message = $1 AND fk_utilisateur = $2 AND reaction_type = $3
				 RETURNING *`,
				[fk_message, fk_utilisateur, reaction_type]
			);
			return result.rows[0];
		} catch (error) {
			console.error('Erreur dans Reaction.delete:', error);
			throw error;
		}
	}

	// Récupérer les réactions d'un message
	static async getByMessage(messageId, userId = null) {
		try {
			let query, params;
			if (userId) {
				query = `
					SELECT reaction_type, COUNT(*) as count, 
						CASE WHEN SUM(CASE WHEN fk_utilisateur = $1 THEN 1 ELSE 0 END) > 0 
						THEN true ELSE false END as user_reacted
					FROM reaction
					WHERE fk_message = $2
					GROUP BY reaction_type
					ORDER BY count DESC
				`;
				params = [userId, messageId];
			} else {
				query = `
					SELECT reaction_type, COUNT(*) as count,
						false as user_reacted
					FROM reaction
					WHERE fk_message = $1
					GROUP BY reaction_type
					ORDER BY count DESC
				`;
				params = [messageId];
			}
			const result = await pool.query(query, params);
			return result.rows;
		} catch (error) {
			console.error('Erreur dans Reaction.getByMessage:', error);
			return [];
		}
	}

	// Récupérer les réactions pour plusieurs messages
	static async getByMessages(messageIds) {
		try {
			if (!messageIds.length) return {};
			const result = await pool.query(
				`SELECT fk_message, reaction_type, COUNT(*) as count
				 FROM reaction
				 WHERE fk_message = ANY($1)
				 GROUP BY fk_message, reaction_type
				 ORDER BY fk_message, count DESC`,
				[messageIds]
			);
			const reactionsMap = {};
			result.rows.forEach(row => {
				if (!reactionsMap[row.fk_message]) {
					reactionsMap[row.fk_message] = [];
				}
				reactionsMap[row.fk_message].push({
					reaction_type: row.reaction_type,
					count: parseInt(row.count),
					user_reacted: false
				});
			});
			return reactionsMap;
		} catch (error) {
			console.error('Erreur dans Reaction.getByMessages:', error);
			return {};
		}
	}
}

export default Reaction;
