import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/validateCode.css';


const ValidateCode = () => {
  React.useEffect(() => {
    import('../styles/login.css');
  }, []);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const initialCode = queryParams.get('code');

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://192.168.1.134:3000/api/users/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (response.ok) {
        // Handle successful validation, e.g., redirect to login page
        console.log('Validation successful:', data);
        setError(''); // Clear any previous error
        navigate('/login');
      } else {
        // Handle validation error
        setError(data.message);
      }
    } catch (error) {
      console.error('Error during validation:', error);
      setError('An error occurred during validation.');
    }
  };

  return (
    <div className="validate-code-container">
      <div className="validate-code-box">
        <h2>Enter Validation Code</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Validation Code</label>
            <input
              type="text"
              placeholder="Enter your validation code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button type="submit" className="validate-button">Validate</button>
        </form>
        {error && <div className="error-popup" style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  );
};

export default ValidateCode;
