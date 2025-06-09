import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Validate.css";
import { API_URL } from "../../config/config";

function Validate() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const inputs = Array(6).fill(0);

  useEffect(() => {
    // Vérifier si l'email est présent dans l'état de navigation
    if (!location.state?.email) {
      navigate("/register");
      return;
    }    // Check for pending invitation in location state or sessionStorage
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validationCode = code.join("");
    const email = location.state?.email;

    try {
      const response = await fetch(`${API_URL}/api/users/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: validationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("userEmail", email);
          // Ajouter un indicateur de validation pour la sécurité
          localStorage.setItem("isValidated", "true");
          // If we have a pending invitation, save it to sessionStorage for the login flow
          if (pendingInvitation) {
            sessionStorage.setItem("pendingInvitation", JSON.stringify(pendingInvitation));
          }
        }
        // Ajout : redirection automatique vers join-workspace si invitation en attente
        const invitation = pendingInvitation || (() => {
          try {
            return JSON.parse(sessionStorage.getItem("pendingInvitation"));
          } catch {
            return null;
          }
        })();
        if (invitation && invitation.workspaceId) {
          // Nettoyer l'invitation du sessionStorage
          sessionStorage.removeItem("pendingInvitation");
          navigate(`/join-workspace?id=${invitation.workspaceId}${invitation.email ? `&email=${encodeURIComponent(invitation.email)}` : ""}`);
        } else {
          navigate("/login");
        }
      } else {
        setError(data.message || "Code invalide");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const email = location.state?.email;
    if (!email) {
      setError("Email non trouvé");
      return;
    }

    try {
      console.log("Sending resend request for:", email); // Debug log
      const response = await fetch(`${API_URL}/api/users/resend-validation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Resend response:", data); // Debug log

      if (response.ok) {
        setError("");
        alert("Un nouveau code a été envoyé à votre email.");
      } else {
        setError(data.message || "Erreur lors de l'envoi du code");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Erreur de connexion au serveur");
    }
  };

  const handleCodeChange = (index, value) => {
    // Gérer le collage (paste)
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, "").slice(0, 6); // Ne garde que les chiffres
      const codeArray = pastedValue.split("").slice(0, 6);
      // Remplir le reste avec des chaînes vides si nécessaire
      while (codeArray.length < 6) {
        codeArray.push("");
      }
      setCode(codeArray);
      // Focus sur le dernier input
      document.getElementById(`validate-5`).focus();
      return;
    }

    // Gestion normale pour un seul caractère
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`validate-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`validate-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const codeArray = pastedData.split("");
    while (codeArray.length < 6) {
      codeArray.push("");
    }
    setCode(codeArray);
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

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit} className="verification-form">
            <div className="code-inputs">
              {inputs.map((_, index) => (
                <input
                  key={index}
                  id={`validate-${index}`}
                  type="text"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e, index)} // Ajout de l'événement onPaste
                  className="code-input"
                />
              ))}
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Validation..." : "Valider"}
            </button>

            <p className="resend-text">
              Vous n'avez pas reçu de code ?
              <button
                type="button"
                onClick={handleResendCode}
                className="resend-link"
              >
                Renvoyer
              </button>
            </p>
          </form>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Validate;
