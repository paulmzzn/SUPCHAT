import pool from '../config/dbConnection.js';

class ReactionModel {
    static async addReaction(messageId, userId, emoji) {
        try {
            const query = `
                INSERT INTO reaction (fk_message, fk_utilisateur, emoji_unicode)
                VALUES ($1, $2, $3)
                ON CONFLICT (fk_message, fk_utilisateur, emoji_unicode) DO NOTHING
                RETURNING *
            `;
            const result = await pool.query(query, [messageId, userId, [emoji]]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async removeReaction(messageId, userId, emoji) {
        const query = `
            DELETE FROM reaction
            WHERE fk_message = $1 AND fk_utilisateur = $2 AND emoji_unicode = $3
            RETURNING *
        `;
        const result = await pool.query(query, [messageId, userId, [emoji]]);
        return result.rows[0];
    }

    static async getReactions(messageId) {
        const query = `
            SELECT r.*, u.nom as username
            FROM reaction r
            JOIN utilisateur u ON r.fk_utilisateur = u.id_utilisateur
            WHERE r.fk_message = $1
            ORDER BY r.date_creation ASC
        `;
        const result = await pool.query(query, [messageId]);
        return result.rows;
    }

    static async getReactionsByEmoji(messageId, emoji) {
        const query = `
            SELECT r.*, u.nom as username
            FROM reaction r
            JOIN utilisateur u ON r.fk_utilisateur = u.id_utilisateur
            WHERE r.fk_message = $1 AND r.emoji_unicode = $2
            ORDER BY u.nom ASC
        `;
        const result = await pool.query(query, [messageId, [emoji]]);
        return result.rows;
    }
}

export default ReactionModel;
