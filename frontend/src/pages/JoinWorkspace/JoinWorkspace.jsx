import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/config";
import "./JoinWorkspace.css";

function JoinWorkspace() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("id");
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinStatus, setJoinStatus] = useState("initial"); // "initial", "joining", "success", "error"
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Vérifier la validité du token
        const response = await fetch(`${API_URL}/api/users/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Récupérer les informations du workspace
  useEffect(() => {
    const fetchWorkspaceInfo = async () => {
      if (!workspaceId) {
        setError("ID du workspace manquant dans l'URL");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des informations du workspace");
        }

        const data = await response.json();
        setWorkspace(data);
      } catch (error) {
        console.error("Erreur:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspaceInfo();
    }
  }, [workspaceId]);

  const handleJoinWorkspace = async () => {
    if (!isAuthenticated) {
      // Stocker les informations d'invitation pour après l'authentification
      sessionStorage.setItem("pendingInvitation", JSON.stringify({ workspaceId, email }));
      // Rediriger vers la page de connexion
      navigate("/login");
      return;
    }

    setJoinStatus("joining");

    try {
      const token = localStorage.getItem("token");
      
      // Construire le corps de la requête avec des informations supplémentaires pour les invitations
      const requestBody = {};
      
      // Si un email est présent (cas d'une invitation), l'inclure dans la requête
      if (email) {
        requestBody.invitedEmail = email;
      }
      
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Si le workspace est privé et que l'utilisateur n'a pas d'invitation valide
        if (errorData.message && errorData.message.includes("privé")) {
          // Proposer de faire une demande d'adhésion
          if (confirm("Ce workspace est privé. Voulez-vous envoyer une demande d'adhésion?")) {
            return await sendJoinRequest();
          } else {
            throw new Error("Vous avez annulé votre demande d'adhésion au workspace privé");
          }
        }
        
        throw new Error(errorData.message || "Erreur lors de la tentative de rejoindre le workspace");
      }

      setJoinStatus("success");
      
      // Rediriger vers le workspace après 2 secondes
      setTimeout(() => {
        navigate(`/workspace/${workspaceId}`);
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);
      setJoinStatus("error");
      setError(error.message);
    }
  };

  // Fonction pour envoyer une demande d'adhésion à un workspace privé
  const sendJoinRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi de la demande d'adhésion");
      }

      // Mettre à jour le statut pour afficher un message approprié
      setJoinStatus("request-sent");
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande d'adhésion:", error);
      setError(error.message);
      setJoinStatus("error");
      return false;
    }
  };

  // Rediriger vers la page d'inscription si non connecté
  const handleRedirectToRegister = () => {
    // Stocker les informations d'invitation pour après l'inscription
    sessionStorage.setItem("pendingInvitation", JSON.stringify({ workspaceId, email }));
    // Rediriger vers la page d'inscription
    navigate("/register");
  };

  if (isLoading) {
    return (
      <div className="join-workspace-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-circle"></div>
            <div className="spinner-circle-inner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="join-workspace-page">
        <div className="join-workspace-container error">
          <h1>Oups, une erreur s'est produite</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/workspaces")} className="primary-button">
            Retourner à la liste des workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-workspace-page">
      <div className="join-workspace-container">
        <div className="workspace-image">
          {workspace?.icon_url ? (
            <img 
              src={workspace.icon_url.startsWith('http') 
                ? workspace.icon_url 
                : `https://s3-supchat.s3.fr-par.scw.cloud/${workspace.icon_url}`} 
              alt={workspace?.nom} 
            />
          ) : (
            <img 
              src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80"
              alt="Workspace par défaut"
            />
          )}
        </div>

        <h1>{isAuthenticated ? "Rejoindre le workspace" : "Accès au workspace"}</h1>
        
        {workspace && (
          <div className="workspace-info">
            <h2>{workspace.nom}</h2>
            <p>{workspace.description}</p>
          </div>
        )}

        {joinStatus === "success" ? (
          <div className="success-message">
            <p>Vous avez rejoint le workspace avec succès!</p>
            <p>Redirection en cours...</p>
          </div>
        ) : joinStatus === "request-sent" ? (
          <div className="success-message">
            <p>Votre demande d'adhésion a été envoyée!</p>
            <p>Vous serez notifié lorsque les administrateurs auront traité votre demande.</p>
            <button 
              onClick={() => navigate("/workspaces")} 
              className="primary-button"
              style={{ marginTop: '20px' }}
            >
              Retour aux workspaces
            </button>
          </div>
        ) : joinStatus === "error" ? (
          <div className="error-message">
            <p>Erreur: {error}</p>
            <button onClick={handleJoinWorkspace} className="primary-button">
              Réessayer
            </button>
          </div>
        ) : (
          <div className="action-buttons">
            {isAuthenticated ? (
              <button 
                onClick={handleJoinWorkspace} 
                className="primary-button"
                disabled={joinStatus === "joining"}
              >
                {joinStatus === "joining" ? "Traitement en cours..." : "Rejoindre le workspace"}
              </button>
            ) : (
              <>
                <p>Vous devez être connecté pour rejoindre ce workspace</p>
                <div className="auth-options">
                  <button 
                    onClick={() => navigate(`/login`)} 
                    className="primary-button"
                  >
                    Se connecter
                  </button>
                  <button 
                    onClick={handleRedirectToRegister} 
                    className="secondary-button"
                  >
                    Créer un compte
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinWorkspace;
