import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import googleIcon from '../../assets/icons/google-icon.svg';
import facebookIcon from '../../assets/icons/facebook-icon.svg';
import DatePicker from 'react-datepicker';
import { registerLocale } from "react-datepicker";
import fr from 'date-fns/locale/fr';
import "react-datepicker/dist/react-datepicker.css";
import './Register.css';
import { Link } from 'react-router-dom';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Enregistrer la locale française
  registerLocale('fr', fr);

  // Génération des options pour les selects
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Calcul des dates limites (16-100 ans)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 15);
  const minDate = new Date();
  minDate.setFullYear(maxDate.getFullYear() - 84);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement register logic here
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
                  const words = value.split(' ');
                  const formatted = words.map((word, index) => {
                    if (index === words.length - 1) {
                      return word.toUpperCase();
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                  }).join(' ');
                  setFormData({...formData, name: formatted});
                }}
                value={formData.name}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="exemple@exemple.com"
              />
            </div>
            
            <div className="form-group">
              <div className="password-header">
                <label>Mot de passe</label>
                <a href="#" className="forgot-link">Oublié?</a>
              </div>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
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
            
            <button type="submit" className="login-button">
              S'inscrire
            </button>
          </form>
          
          <div className="social-login">
            <button className="social-button">
              <img src={googleIcon} alt="Google" className="social-icon" /> Google
            </button>
            <button className="social-button">
              <img src={facebookIcon} alt="Facebook" className="social-icon" /> Facebook
            </button>
          </div>
          
          <p className="signup-text">
            Vous avez déjà un compte ? 
            <Link to="/login" className="signup-link">Se connecter</Link>
          </p>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Register;
