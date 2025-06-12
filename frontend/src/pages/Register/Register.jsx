import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import googleIcon from "../../assets/icons/google-icon.svg";
import facebookIcon from "../../assets/icons/facebook-icon.svg";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import fr from "date-fns/locale/fr";
import "react-datepicker/dist/react-datepicker.css";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/config";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const navigate = useNavigate();

  // Enregistrer la locale française
  registerLocale("fr", fr);

  // Vérifier si une invitation est en attente pour cet email
  useEffect(() => {
    const checkPendingInvitation = async () => {
      if (!formData.email) return;

      try {
        const response = await fetch(
          `${API_URL}/api/invitations/pending?email=${encodeURIComponent(
            formData.email
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setPendingInvitation(data.hasPendingInvitation);
        } else {
          throw new Error(data.message || "Erreur lors de la vérification de l'invitation");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    const debounceTimeout = setTimeout(() => {
      checkPendingInvitation();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [formData.email]);

  // Check for pending invitations in sessionStorage
  useEffect(() => {
    const pendingInviteData = sessionStorage.getItem("pendingInvitation");
    
    if (pendingInviteData) {
      try {
        const inviteInfo = JSON.parse(pendingInviteData);
        setPendingInvitation(inviteInfo);
        
        // Pre-fill email if it's provided in the invitation
        if (inviteInfo?.email) {
          setFormData(prev => ({ ...prev, email: inviteInfo.email }));
        }
      } catch (e) {
        console.error("Error parsing pending invitation data:", e);
      }
    }
  }, []);

  // Génération des options pour les selects
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Calcul des dates limites (16-100 ans)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 15);
  const minDate = new Date();
  minDate.setFullYear(maxDate.getFullYear() - 84);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation du formulaire
    if (!formData.name || !formData.email || !formData.password || !birthDate) {
      setError("Tous les champs sont requis");
      return;
    }

    // Validation de l'âge minimal (16 ans)
    const today = new Date();
    const ageDiff = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const isMinimumAge =
      ageDiff > 16 || (ageDiff === 16 && monthDiff >= 0 && today.getDate() >= birthDate.getDate());

    if (!isMinimumAge) {
      setError("Vous devez avoir au moins 16 ans pour vous inscrire");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: formData.name,
          email: formData.email,
          mot_de_passe: formData.password,
          date_naissance: birthDate.toISOString().split("T")[0], // Format YYYY-MM-DD
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }      // Store the pending invitation info if present
      if (pendingInvitation) {
        // Keep it in sessionStorage for consistency
        sessionStorage.setItem("pendingInvitation", JSON.stringify(pendingInvitation));
      }

      // Redirection vers la page de login avec un message de succès
      // Le code de validation sera envoyé lors du login
      navigate("/login", {
        state: { 
          email: formData.email,
          // Pass the pending invitation info if available
          pendingInvitation: pendingInvitation || null
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setBirthDate(date);
    // Force le scroll en haut avec un petit délai pour laisser le clavier se fermer
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  return (
    <div className="login-container">
      <h1 className="app-title">
        SUPCHAT<span className="dot">.</span>
      </h1>
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">S'inscrire</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                placeholder="Jean DUPONT"
                autoComplete="name"
                name="fullname"
                onChange={(e) => {
                  // Formatage automatique lors de la saisie ou de l'autocomplétion
                  const value = e.target.value;
                  const words = value.split(" ");
                  const formatted = words
                    .map((word, index) => {
                      if (index === words.length - 1) {
                        return word.toUpperCase();
                      }
                      return (
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                      );
                    })
                    .join(" ");
                  setFormData({ ...formData, name: formatted });
                }}
                value={formData.name}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="exemple@exemple.com"
                autoComplete="email"
                name="email"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                value={formData.email}
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label>Mot de passe</label>
              </div>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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

            <div className="form-group">
              <label>Date de naissance</label>
              <DatePicker
                selected={birthDate}
                onChange={handleDateChange}
                onCalendarClose={() => window.scrollTo(0, 0)}
                dateFormat="dd/MM/yyyy"
                maxDate={maxDate}
                minDate={minDate}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={84}
                scrollableYearDropdown
                placeholderText="Sélectionnez votre date de naissance"
                className="form-group-input"
                calendarClassName="custom-datepicker"
                locale="fr"
                popperPlacement="top"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Inscription en cours..." : "S'inscrire"}
            </button>
          </form>

          <div className="social-login">
            <button className="social-button">
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
            Vous avez déjà un compte ?
            <Link to="/login" className="signup-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Register;
