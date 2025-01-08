import React from 'react';
import '../styles/login.css';

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-logo">SUPCHAT<span className="dot">.</span></div>
      <div className="login-box">
        <h2>Login to your account</h2>
        <form>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="exemple@exemple.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input type="password" placeholder="Enter your password" />
              <span className="eye-icon">👁️</span>
            </div>
            <a href="#" className="forgot-link">Forgot?</a>
          </div>
          <button type="submit" className="login-button">Login now</button>
        </form>
        <button className="google-login">Google</button>
        <div className="signup-link">
          Don't Have An Account? <a href="#">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;