import React, { useState } from "react";
import {
  FaGoogle,
  FaInfoCircle,
  FaUser,
  FaKey,
  FaCog,
  FaCheckCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import "./GoogleDriveSetup.css";

/**
 * Composant de configuration Google Drive qui tient compte de la colonne google_id
 */
const GoogleDriveSetupIntegrated = ({
  onComplete,
  onCancel,
  authConfig,
  currentUser = null,
}) => {
  const [clientId, setClientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId.trim()) return;

    setIsSubmitting(true);
    try {
      await onComplete(clientId.trim());
    } catch (error) {
      console.error("Erreur configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu selon le mode d'authentification détecté
  const renderContent = () => {
    switch (authConfig.mode) {
      case "existing_google_account":
        return renderExistingGoogleAccount();
      case "admin_config":
        return renderAdminConfig();
      case "personal_config":
        return renderPersonalConfig();
      default:
        return renderNoConfig();
    }
  };

  const renderExistingGoogleAccount = () => (
    <div className="setup-content">
      <div className="existing-account-section">
        <div className="account-info">
          <FaUser className="large-icon" />
          <h4>Compte Google détecté</h4>
          <p>
            Votre compte SUPCHAT est déjà lié à un compte Google. L'intégration
            Google Drive utilisera automatiquement ce compte.
          </p>
        </div>

        <div className="account-details">
          <div className="detail-item">
            <FaCheckCircle />
            <span>Utilisateur: {currentUser?.nom}</span>
          </div>
          <div className="detail-item">
            <FaGoogle />
            <span>Google ID: {currentUser?.google_id}</span>
          </div>
        </div>

        <div className="benefits">
          <h5>Avantages de cette configuration :</h5>
          <ul>
            <li>✅ Connexion automatique sans configuration supplémentaire</li>
            <li>✅ Sécurité renforcée via l'authentification SUPCHAT</li>
            <li>✅ Accès direct à vos fichiers Google Drive</li>
            <li>✅ Pas besoin de configurer d'API keys</li>
          </ul>
        </div>

        <div className="note">
          <FaInfoCircle />
          <span>
            Cette configuration utilise votre authentification Google existante
            pour accéder à Drive de manière sécurisée.
          </span>
        </div>

        <div className="actions">
          <button
            onClick={() =>
              onComplete(process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID)
            }
            className="primary-btn"
          >
            <FaGoogle />
            Utiliser mon compte Google
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdminConfig = () => (
    <div className="setup-content">
      <div className="admin-config-section">
        <div className="config-info">
          <FaCog className="large-icon" />
          <h4>Configuration Administrateur</h4>
          <p>
            L'administrateur a configuré Google Drive pour tous les
            utilisateurs. Vous pouvez utiliser cette configuration ou configurer
            votre propre accès.
          </p>
        </div>

        <div className="config-options">
          <div className="option-card recommended">
            <h5>
              <FaCheckCircle />
              Configuration globale (Recommandé)
            </h5>
            <p>Utiliser la configuration mise en place par l'administrateur</p>
            <ul>
              <li>✅ Prêt à utiliser immédiatement</li>
              <li>✅ Maintenance assurée par l'administrateur</li>
              <li>✅ Configuration sécurisée</li>
            </ul>
            <button
              onClick={() =>
                onComplete(process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID)
              }
              className="primary-btn"
            >
              <FaGoogle />
              Utiliser la configuration globale
            </button>
          </div>

          <div className="option-card">
            <h5>
              <FaKey />
              Configuration personnelle
            </h5>
            <p>Utiliser votre propre Client ID Google</p>
            <form onSubmit={handleSubmit} className="personal-form">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Votre Client ID OAuth 2.0"
                className="client-id-input"
              />
              <button
                type="submit"
                disabled={!clientId.trim() || isSubmitting}
                className="secondary-btn"
              >
                {isSubmitting ? "Configuration..." : "Configurer"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalConfig = () => (
    <div className="setup-content">
      <div className="personal-config-section">
        <div className="config-info">
          <FaKey className="large-icon" />
          <h4>Configuration Personnelle Active</h4>
          <p>
            Vous utilisez actuellement votre propre configuration Google Drive.
          </p>
        </div>

        <div className="current-config">
          <div className="config-item">
            <FaCheckCircle />
            <span>Client ID personnel configuré</span>
          </div>
        </div>

        <div className="actions">
          <button
            onClick={() =>
              onComplete(
                localStorage.getItem("personal_google_drive_client_id")
              )
            }
            className="primary-btn"
          >
            <FaGoogle />
            Continuer avec cette configuration
          </button>
        </div>
      </div>
    </div>
  );

  const renderNoConfig = () => (
    <div className="setup-content">
      <div className="no-config-section">
        <div className="config-info">
          <FaExternalLinkAlt className="large-icon" />
          <h4>Configuration Google Drive</h4>
          <p>
            Pour utiliser Google Drive, vous devez configurer l'accès à l'API
            Google. Vous avez plusieurs options :
          </p>
        </div>

        <div className="config-options">
          <div className="option-card">
            <h5>
              <FaUser />
              Utiliser votre propre projet Google
            </h5>
            <p>Recommandé si vous avez déjà un projet Google Cloud</p>

            <div className="steps">
              <h6>Étapes à suivre :</h6>
              <ol>
                <li>
                  Allez sur{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Créez un projet ou sélectionnez un projet existant</li>
                <li>Activez l'API Google Drive</li>
                <li>Créez des identifiants OAuth 2.0</li>
                <li>
                  Ajoutez <code>http://localhost:3001</code> aux origines
                  autorisées
                </li>
                <li>Copiez votre Client ID ci-dessous</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="client-id-form">
              <div className="form-group">
                <label htmlFor="clientId">Client ID OAuth 2.0:</label>
                <input
                  type="text"
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="123456789-abcdef.apps.googleusercontent.com"
                  className="client-id-input"
                />
              </div>
              <button
                type="submit"
                disabled={!clientId.trim() || isSubmitting}
                className="primary-btn"
              >
                <FaGoogle />
                {isSubmitting ? "Configuration..." : "Configurer Google Drive"}
              </button>
            </form>
          </div>

          <div className="option-card admin-option">
            <h5>
              <FaCog />
              Demander à l'administrateur
            </h5>
            <p>
              L'administrateur peut configurer Google Drive pour tous les
              utilisateurs, ce qui simplifie l'utilisation pour tout le monde.
            </p>
            <div className="admin-contact">
              <FaInfoCircle />
              <span>
                Contactez l'administrateur de SUPCHAT pour cette option
              </span>
            </div>
          </div>
        </div>

        <div className="privacy-note">
          <FaInfoCircle />
          <div>
            <strong>Confidentialité :</strong>
            <p>
              Votre Client ID sera stocké uniquement dans votre navigateur.
              SUPCHAT n'aura accès qu'aux fichiers que vous choisissez
              explicitement de partager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="google-drive-setup">
      <div className="setup-header">
        <h3>Configuration Google Drive</h3>
        {currentUser?.google_id && (
          <div className="user-google-status">
            <FaGoogle />
            <span>Compte Google connecté</span>
          </div>
        )}
      </div>

      {renderContent()}

      {onCancel && (
        <div className="setup-footer">
          <button onClick={onCancel} className="cancel-btn">
            Annuler
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveSetupIntegrated;
