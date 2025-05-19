-- Script de création de la table workspace_join_requests
CREATE TABLE IF NOT EXISTS workspace_join_requests (
    id_request SERIAL PRIMARY KEY,
    fk_workspace INTEGER NOT NULL REFERENCES workspace(id_workspace) ON DELETE CASCADE,
    fk_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    message TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP,
    fk_administrateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
    reject_reason TEXT,
    UNIQUE(fk_workspace, fk_utilisateur, statut)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_workspace_join_requests_workspace ON workspace_join_requests(fk_workspace);
CREATE INDEX IF NOT EXISTS idx_workspace_join_requests_utilisateur ON workspace_join_requests(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_workspace_join_requests_statut ON workspace_join_requests(statut);