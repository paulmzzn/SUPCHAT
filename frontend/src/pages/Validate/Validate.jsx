import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CodeValidationForm from "../../components/shared/CodeValidationForm";
import "./Validate.css";

function Validate() {
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Vérifier si l'email est présent dans l'état de navigation
    if (!location.state?.email) {
      navigate("/register");
      return;
    }
    
    // Check for pending invitation in location state or sessionStorage
    const inviteFromState = location.state?.pendingInvitation;
    const inviteFromStorage = sessionStorage.getItem("pendingInvitation");

    if (inviteFromState) {
      setPendingInvitation(inviteFromState);
    } else if (inviteFromStorage) {
      try {
        setPendingInvitation(JSON.parse(inviteFromStorage));
      } catch (e) {
        console.error("Error parsing pending invitation data:", e);
      }
    }
  }, [location.state, navigate]);

  const handleValidationSuccess = (data) => {
    if (data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userEmail", location.state?.email);
      // Ajouter un indicateur de validation pour la sécurité
      localStorage.setItem("isValidated", "true");
      
      // If we have a pending invitation, save it to sessionStorage for the login flow
      if (pendingInvitation) {
        sessionStorage.setItem("pendingInvitation", JSON.stringify(pendingInvitation));
      }
    }
    navigate("/login");
  };
  return (
    <div className="login-container">
      <h1 className="app-title">
        SUPCHAT<span className="dot">.</span>
      </h1>
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Validation du compte</h2>
          <p className="verification-text">
            Veuillez entrer le code à 6 chiffres envoyé à votre adresse email :
            <br />
            <strong>{location.state?.email}</strong>
          </p>

          <CodeValidationForm
            email={location.state?.email}
            onSuccess={handleValidationSuccess}
            submitButtonText="Valider"
            resendButtonText="Renvoyer"
            inputIdPrefix="validate"
          />
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Validate;
