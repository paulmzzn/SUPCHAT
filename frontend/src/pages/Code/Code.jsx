import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CodeValidationForm from '../../components/shared/CodeValidationForm';
import './Code.css';

const Code = () => {
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'email pour l'afficher et la validation
  const emailToDisplay = localStorage.getItem("email") || location.state?.email || "votre adresse email";

  // Vérifier au chargement que nous avons bien un email
  useEffect(() => {
    // S'assurer que nous avons un email stocké
    const storedEmail = localStorage.getItem('email');
    const stateEmail = location.state?.email;
    
    if (stateEmail && !storedEmail) {
      localStorage.setItem('email', stateEmail);
    }
    
    const emailToUse = storedEmail || stateEmail;
    
    if (!emailToUse) {
      navigate('/login');
      return;
    }
    
    // Vérifier les invitations en attente
    const pendingInviteData = sessionStorage.getItem("pendingInvitation");
    if (pendingInviteData) {
      try {
        setPendingInvitation(JSON.parse(pendingInviteData));
      } catch (e) {
        console.error("Erreur lors de l'analyse des données d'invitation en attente:", e);
      }
    }
    
    // Vérifier si déjà validé pour éviter une double validation
    if (localStorage.getItem('isValidated') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate, location.state]);

  const handleValidationSuccess = (data) => {
    // IMPORTANT: Stocker le token correctement et s'assurer qu'il est bien enregistré
    if (data.token) {
      // Nettoyer d'abord le localStorage pour éviter tout conflit
      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      
      // Stocker le token avec les deux noms possibles pour la compatibilité
      localStorage.setItem("token", data.token);
      localStorage.setItem("userToken", data.token);
      
      // CRUCIAL: Définir l'indicateur de validation
      localStorage.setItem("isValidated", "true");
      
      // Handle pending workspace invitation if present
      if (pendingInvitation && pendingInvitation.workspaceId) {
        // Remove the pending invitation from sessionStorage
        sessionStorage.removeItem("pendingInvitation");
        
        // Redirect to the join-workspace page after a slight delay to ensure token is stored
        setTimeout(() => {
          navigate(`/join-workspace?id=${pendingInvitation.workspaceId}&email=${pendingInvitation.email || emailToDisplay}`);
        }, 300);
      } else {
        // Regular flow - redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      }
    } else {
      console.error("Token manquant dans la réponse du serveur");
    }
  };
  return (
    <div className="login-container">
      <h1 className="app-title">
        SUPCHAT<span className="dot">.</span>
      </h1>
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Vérification par email</h2>
          <p className="verification-text">
            Veuillez entrer le code à 6 chiffres envoyé à <strong>{emailToDisplay}</strong>
          </p>

          <CodeValidationForm
            email={emailToDisplay}
            onSuccess={handleValidationSuccess}
            submitButtonText="Vérifier"
            resendButtonText="Renvoyer"
            inputIdPrefix="code"
          />
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Code;
