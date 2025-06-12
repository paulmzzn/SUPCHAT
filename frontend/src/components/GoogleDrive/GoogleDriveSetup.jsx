import React, { useState } from "react";
import { FaGoogle, FaInfoCircle, FaExternalLinkAlt } from "react-icons/fa";
import "./GoogleDriveSetup.css";

/**
 * Composant pour configurer Google Drive avec un Client ID personnel
 */
const GoogleDriveSetup = ({ onClientIdSubmit, onCancel }) => {
  const [clientId, setClientId] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clientId.trim()) {
      onClientIdSubmit(clientId.trim());
    }
  };

  // Utiliser un Client ID de test pour la démonstration
  const handleUseTestClientId = () => {
    const testClientId =
      "REDACTED";
    setClientId(testClientId);
    onClientIdSubmit(testClientId);
  };

  return (
    <div className="google-drive-setup">
      <div className="setup-header">
        <FaGoogle className="setup-icon" />
        <h3>Configuration Google Drive</h3>
        <p>
          Pour accéder à vos fichiers Google Drive, vous pouvez utiliser votre
          propre Client ID OAuth 2.0 ou demander à l'administrateur de
          configurer l'intégration.
        </p>
      </div>{" "}
      <div className="setup-content">
        <div className="setup-option quick-test">
          <h4>🚀 Test rapide</h4>
          <p>
            Pour tester rapidement l'intégration Google Drive, utilisez notre
            Client ID de démonstration (limité mais fonctionnel).
          </p>
          <button
            type="button"
            onClick={handleUseTestClientId}
            className="test-btn"
          >
            <FaGoogle />
            Utiliser le Client ID de test
          </button>
          <small className="test-note">
            ⚠️ Ce Client ID est configuré pour les tests et peut avoir des
            limitations.
          </small>
        </div>
        <div className="setup-divider">
          <span>ou</span>
        </div>
        <div className="setup-option">
          <h4>Utiliser votre propre Client ID</h4>
          <p>
            Si vous avez un projet Google Cloud Console, vous pouvez utiliser
            votre propre Client ID pour accéder à vos fichiers.
          </p>

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
            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={!clientId.trim()}
              >
                <FaGoogle />
                Connecter avec ce Client ID
              </button>
              <button type="button" onClick={onCancel} className="cancel-btn">
                Annuler
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="instructions-toggle"
          >
            <FaInfoCircle />
            {showInstructions ? "Masquer" : "Comment obtenir un Client ID ?"}
          </button>

          {showInstructions && (
            <div className="instructions">
              <h5>Instructions pour obtenir un Client ID :</h5>
              <ol>
                <li>
                  Allez sur{" "}
                  <a
                    href="https://console.developers.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Cloud Console <FaExternalLinkAlt />
                  </a>
                </li>
                <li>
                  Créez un nouveau projet ou sélectionnez un projet existant
                </li>
                <li>
                  Activez l'API Google Drive dans la section "APIs & Services"
                </li>
                <li>Créez des identifiants OAuth 2.0 dans "Credentials"</li>
                <li>
                  Ajoutez <code>http://192.168.71.234:3001</code> dans les
                  "Authorized JavaScript origins"
                </li>
                <li>Copiez votre Client ID et collez-le ci-dessus</li>
              </ol>
              <div className="note">
                <FaInfoCircle />
                <span>
                  Votre Client ID restera stocké localement dans votre
                  navigateur uniquement.
                </span>
              </div>
            </div>
          )}
        </div>{" "}
        <div className="setup-divider">
          <span>ou</span>
        </div>
        <div className="setup-option">
          <h4>Demander à l'administrateur</h4>
          <p>
            Contactez l'administrateur de SUPCHAT pour qu'il configure
            l'intégration Google Drive globalement pour tous les utilisateurs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveSetup;
