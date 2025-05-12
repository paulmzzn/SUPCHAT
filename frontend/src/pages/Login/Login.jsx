import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import googleIcon from "../../assets/icons/google-icon.svg";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Tentative de connexion...');
    
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, mot_de_passe: password }),
      });
      
      const data = await response.json();
      console.log('Réponse du serveur:', data);
      
      if (response.ok) {
        // Stocker l'email et le token dans localStorage
        localStorage.setItem('email', email);
        localStorage.setItem('token', data.token);
        
        console.log('Email et token sauvegardés dans localStorage');
        console.log('Token présent:', localStorage.getItem('token') ? "oui" : "non");
        console.log('Connexion réussie, redirection vers /code');
        
        // Redirigez l'utilisateur vers la page Code
        navigate('/code');
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/users/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      setResetMessage(data.message);

      if (response.ok) {
        setResetStep(2);
      }
    } catch (error) {
      setResetMessage("Erreur lors de la demande de réinitialisation");
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (resetCode.length !== 6) {
      setResetMessage("Le code doit contenir 6 chiffres");
      return;
    }
    setResetStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetMessage("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      setResetMessage(data.message);

      if (response.ok) {
        setTimeout(() => {
          setShowResetModal(false);
          setResetStep(1);
          setResetEmail("");
          setResetCode("");
          setNewPassword("");
          setConfirmPassword("");
          setResetMessage("");
        }, 2000);
      }
    } catch (error) {
      setResetMessage("Erreur lors de la réinitialisation du mot de passe");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/users/auth/google`;
  };

  const handleCodeChange = (index, value) => {
    // Gérer le collage (paste)
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, "").slice(0, 6); // Ne garde que les chiffres
      setResetCode(pastedValue);
      document.getElementById(`reset-code-5`).focus();
      return;
    }

    // Gestion normale pour un seul caractère
    const code = resetCode.split("");
    code[index] = value;
    setResetCode(code.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !resetCode[index] && index > 0) {
      const prevInput = document.getElementById(`reset-code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    setResetCode(pastedData);
  };

  const renderResetStep = () => {
    switch (resetStep) {
      case 1:
        return (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Entrez votre email"
                required
              />
            </div>
            <button type="submit" className="reset-button">
              Envoyer le code
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Code de vérification</label>
              <div className="code-inputs">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <input
                      key={index}
                      id={`reset-code-${index}`}
                      type="text"
                      maxLength={1}
                      value={resetCode[index] || ""}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={(e) => handlePaste(e, index)} // Ajout de l'événement onPaste
                      className="code-input"
                    />
                  ))}
              </div>
            </div>
            <button type="submit" className="reset-button">
              Vérifier le code
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer votre nouveau mot de passe"
                required
              />
            </div>
            <button type="submit" className="reset-button">
              Réinitialiser le mot de passe
            </button>
          </form>
        );
    }
  };

  return (
    <div className="login-container">
      <h1 className="app-title">
        SUPCHAT<span className="dot">.</span>
      </h1>
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Se connecter à votre compte</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="exemple@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label>Mot de passe</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowResetModal(true)}
                >
                  Oublié?
                </button>
              </div>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="login-button">
              Se connecter
            </button>
          </form>

          <div className="social-login">
            <button className="social-button" onClick={handleGoogleLogin}>
              <img src={googleIcon} alt="Google" className="social-icon" />{" "}
              Google
            </button>
            <button
              className="social-button"
              onClick={() => {
                window.location.href = `${API_URL}/api/users/auth/github`;
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="social-icon"
                style={{ marginRight: 8 }}
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .268.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" fill="#fff"/>
              </svg>
              GitHub
            </button>
          </div>

          <p className="signup-text">
            Vous n'avez pas encore de compte ?
            <Link to="/register" className="signup-link">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="reset-modal">
            <h2>Réinitialisation du mot de passe</h2>
            <button
              className="close-modal"
              onClick={() => {
                setShowResetModal(false);
                setResetStep(1);
                setResetMessage("");
              }}
            >
              ×
            </button>
            {resetMessage && (
              <p
                className={`reset-message ${
                  resetMessage.includes("Erreur") ? "error" : "success"
                }`}
              >
                {resetMessage}
              </p>
            )}
            {renderResetStep()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
