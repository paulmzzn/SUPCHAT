import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import googleIcon from '../../assets/icons/google-icon.svg';
import facebookIcon from '../../assets/icons/facebook-icon.svg';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Tentative de connexion...'); // Debug log

    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          mot_de_passe: password,
        }),
      });

      const data = await response.json();
      console.log('Réponse du serveur:', data); // Debug log

      if (response.ok) {
        console.log('Connexion réussie, redirection vers /code'); // Debug log
        localStorage.removeItem('isValidated');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userToken', data.token);
        navigate('/code');
      } else {
        console.error('Erreur:', data.message); // Debug log
        setError(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error); // Debug log
      setError('Erreur de connexion au serveur');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/users/auth/google';
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
                <a href="#" className="forgot-link">Oublié?</a>
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
