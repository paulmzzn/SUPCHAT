import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/svg/google-logo.svg'; // Importation du logo Google

const Register = () => {
  React.useEffect(() => {
    import('../styles/login.css');
  }, []);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: name,
          email,
          mot_de_passe: password,
          photo_de_profil: '/images/profile.png', // Default profile picture
          fk_statut: 1 // Default status
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

  return (
    <div className="login-container">
      <div className="login-logo">SUPCHAT<span className="dot">.</span></div>
      <div className="login-box">
        <h2>Create an account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
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
            <label>Password</label>
            <div className="password-field">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="eye-icon"></span>
            </div>
            <a href="#" className="forgot-link">Forgot ?</a>
          </div>
          <button type="submit" className="login-button">Register now</button>
        </form>
        {error && <div className="error-popup" style={{ color: 'red' }}>{error}</div>}
        <div className="or-separator">or</div> {/* Ajouté pour le séparateur "or" */}
        <button className="google-login" onClick={() => window.location.href = 'http://localhost:3000/auth/google'}>
          <img src={googleLogo} alt="Google logo" className="google-logo" />
          Continue with Google
        </button>
        <div className="signup-link">
          Already have an account? <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
};

export default Register;