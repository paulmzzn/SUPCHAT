import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/svg/google-logo.svg'; // Importation du logo Google

const Register = () => {
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    import('../styles/login.css').then(() => setCssLoaded(true));
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://192.168.1.134:3000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: name,
          email,
          mot_de_passe: password,
          photo_de_profil: '/images/profile.png', // Default profile picture
          fk_statut: 1, // Default status
          device_id: 'some_device_id', // Add device_id
          device_name: 'some_device_name' // Add device_name
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Handle successful registration, e.g., redirect to validation code page
        console.log('Registration successful:', data);
        setError(''); // Clear any previous error
        navigate('/validate-code', { state: { email: data.user.email } });
      } else {
        // Handle registration error
        setError(data.message);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError('An error occurred during registration.');
    }
  };

  if (!cssLoaded) {
    return null; // or a loading spinner
  }

  return (
    <div className="login-container">
      <div className="login-logo">SUPCHAT<span className="dot">.</span></div>
      <div className="login-box">
        <h2>S'inscrire</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <label>Mot de passe</label>
            <div className="password-field">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="eye-icon"></span>
            </div>
          </div>
          <button type="submit" className="login-button">S'inscrire</button>
        </form>
        {error && <div className="error-popup" style={{ color: 'red' }}>{error}</div>}
        <div className="or-separator">or</div> {/* Ajouté pour le séparateur "or" */}
        <button className="google-login" onClick={() => window.location.href = 'http://192.168.1.134:3000/auth/google'}>
          <img src={googleLogo} alt="Google logo" className="google-logo" />
          S'inscrire avec Google
        </button>
        <div className="signup-link">
            Déjà un compte ? <a href="/login">Se connecter</a>
        </div>
      </div>
    </div>
  );
};

export default Register;