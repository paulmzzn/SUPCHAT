import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import googleIcon from '../../assets/icons/google-icon.svg';
import facebookIcon from '../../assets/icons/facebook-icon.svg';
import './Login.css';
import { Link } from 'react-router-dom';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement login logic here
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
            
            <button type="submit" className="login-button">
              Se connecter
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
            Vous n'avez pas encore de compte ? 
            <Link to="/register" className="signup-link">S'inscrire</Link>
          </p>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Login;
