import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/svg/google-logo.svg'; // Importation du logo Google

const Login = () => {
  React.useEffect(() => {
    import('../styles/login.css');
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, mot_de_passe: password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Handle successful login, e.g., save token, redirect, etc.
        console.log('Login successful:', data);
        setError(''); // Clear any previous error
        navigate('/account', { state: { user: data.user, token: data.token } });
      } else {
        // Handle login error
        setError(data.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('An error occurred during login.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">SUPCHAT<span className="dot">.</span></div>
      <div className="login-box">
        <h2>Login to your account</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="login-button">Login now</button>
        </form>
        {error && <div className="error-popup" style={{ color: 'red' }}>{error}</div>}
        <div className="or-separator">or</div> {/* Ajouté pour le séparateur "or" */}
        <button className="google-login" onClick={() => window.location.href = 'http://localhost:3000/auth/google'}>
          <img src={googleLogo} alt="Google logo" className="google-logo" />
          Continue with Google
        </button>
        <div className="signup-link">
          Don't Have An Account? <a href="/register">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;