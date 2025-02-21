import { useState } from 'react';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import './Login.css';

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
          <h2 className="login-title">Login to your account</h2>
          
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
                <label>Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
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
              Login now
            </button>
          </form>

          <p className="or">
            OR
          </p>
          
          <div className="social-login">
            <button className="social-button">
              <FaGoogle /> Google
            </button>
            <button className="social-button">
              <FaFacebook /> Facebook
            </button>
          </div>
          
          <p className="signup-text">
            Don't Have An Account? 
            <a href="#" className="signup-link">Sign Up</a>
          </p>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Login;
