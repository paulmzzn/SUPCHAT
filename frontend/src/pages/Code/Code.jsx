import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/config';
import './Code.css';

const Code = ({ email }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const navigate = useNavigate();
  const inputs = Array(6).fill(0);

  // Vérifier au chargement que nous avons bien un email
  useEffect(() => {
    // S'assurer que nous avons un email stocké
    const storedEmail = localStorage.getItem('email');
    if (!storedEmail && email) {
      localStorage.setItem('email', email);
      console.log("Email sauvegardé dans localStorage:", email);
    }
    
    console.log("Code.jsx - Email utilisé:", storedEmail || email || "Non défini");
    console.log("Code.jsx - Token présent:", localStorage.getItem('token') ? "oui" : "non");
      // Vérifier les invitations en attente
    const pendingInviteData = sessionStorage.getItem("pendingInvitation");
    if (pendingInviteData) {
      try {
        setPendingInvitation(JSON.parse(pendingInviteData));
      } catch (e) {
        console.error("Erreur lors de l'analyse des données d'invitation en attente:", e);
      }
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Utiliser l'email stocké ou celui passé en props
    const emailToUse = localStorage.getItem("email") || email;
    if (!emailToUse) {
      setError("Email non disponible. Veuillez vous reconnecter.");
      return;
    }
    
    const validationCode = code.join("");
    console.log("Envoi de la requête de validation:", { email: emailToUse, code: validationCode });

    try {
      const response = await fetch(`${API_URL}/api/users/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToUse,
          code: validationCode,
        }),
      });

      const data = await response.json();
      console.log("Réponse du serveur:", data);

      if (response.ok) {
        // IMPORTANT: Stocker le token correctement et s'assurer qu'il est bien enregistré
        if (data.token) {
          console.log("Sauvegarde du token après validation:", data.token.substring(0, 15) + "...");
          
          // Nettoyer d'abord le localStorage pour éviter tout conflit
          localStorage.removeItem("token");
          
          // Stocker le token avec le bon nom
          localStorage.setItem("token", data.token);
          
          // Vérifier que le token a bien été stocké
          const storedToken = localStorage.getItem("token");
          console.log("Token vérifié après stockage:", storedToken ? "Présent" : "Absent");
            // Handle pending workspace invitation if present
          if (pendingInvitation && pendingInvitation.workspaceId) {
            // Remove the pending invitation from sessionStorage
            sessionStorage.removeItem("pendingInvitation");
            
            // Redirect to the join-workspace page after a slight delay to ensure token is stored
            setTimeout(() => {
              console.log("Redirection vers l'invitation de workspace avec token:", localStorage.getItem("token") ? "Présent" : "Absent");
              navigate(`/join-workspace?id=${pendingInvitation.workspaceId}&email=${pendingInvitation.email || emailToUse}`);
            }, 300);
          } else {
            // Regular flow - redirect to dashboard
            setTimeout(() => {
              console.log("Redirection vers dashboard avec token:", localStorage.getItem("token") ? "Présent" : "Absent");
              navigate("/dashboard");
            }, 300);
          }
        } else {
          setError("Token manquant dans la réponse du serveur");
        }
      } else {
        console.error("Erreur:", data.message);
        setError(data.message || "Code invalide");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Erreur de connexion au serveur");
    }
  };

  const handleResendCode = async () => {
    const email = localStorage.getItem("userEmail");

    try {
      const response = await fetch(`${API_URL}/api/users/resend-validation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setError("");
        alert("Un nouveau code a été envoyé à votre email.");
      } else {
        setError(data.message || "Erreur lors de l'envoi du code");
      }
    } catch (error) {
      console.error("Error:", error);
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
      document.getElementById(`code-5`).focus();
      return;
    }

    // Gestion normale pour un seul caractère
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
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
          <h2 className="login-title">Vérification par email</h2>
          <p className="verification-text">
            Veuillez entrer le code à 6 chiffres envoyé à votre adresse email
          </p>

          {error && (
            <p className="error-message" style={{ color: "red" }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="verification-form">
            <div className="code-inputs">
              {inputs.map((_, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
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

            <button type="submit" className="login-button">
              Vérifier
            </button>

            <p className="resend-text">
              Vous n'avez pas reçu de code?
              <button onClick={handleResendCode} className="resend-link">
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

export default Code;
