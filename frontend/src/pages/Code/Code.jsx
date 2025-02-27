import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Code.css';

function Code() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputs = Array(6).fill(0);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const email = localStorage.getItem('userEmail');
    if (!email) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('userEmail');
    const validationCode = code.join('');
    console.log('Sending validation request:', { email, code: validationCode }); // Debug log

    try {
      const response = await fetch('http://localhost:3000/api/users/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: validationCode,
        }),
      });

      const data = await response.json();
      console.log('Server response:', data); // Debug log

      if (response.ok) {
        // Mettre à jour le token si un nouveau est fourni
        if (data.token) {
          localStorage.setItem('userToken', data.token);
        }
        localStorage.setItem('isValidated', 'true');
        navigate('/dashboard');
      } else {
        console.error('Erreur:', data.message); // Debug log
        setError(data.message || 'Code invalide');
      }
    } catch (error) {
      console.error('Error:', error); // Debug log
      setError('Erreur de connexion au serveur');
    }
  };

  const handleResendCode = async () => {
    const email = localStorage.getItem('userEmail');
    
    try {
      const response = await fetch('http://localhost:3000/api/users/resend-validation', {  // Changement de l'endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        alert('Un nouveau code a été envoyé à votre email.');
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleCodeChange = (index, value) => {
    // Gérer le collage (paste)
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, '').slice(0, 6); // Ne garde que les chiffres
      const codeArray = pastedValue.split('').slice(0, 6);
      // Remplir le reste avec des chaînes vides si nécessaire
      while (codeArray.length < 6) {
        codeArray.push('');
      }
      setCode(codeArray);
      // Focus sur le dernier input
      document.getElementById(`code-5`).focus();
      return;
    }

    // Gestion normale pour un seul caractère
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const codeArray = pastedData.split('');
    while (codeArray.length < 6) {
      codeArray.push('');
    }
    setCode(codeArray);
  };

  return (
    <div className="login-container">
      <h1 className="app-title">
        SUPCHAT<span className="dot">.</span>
      </h1>
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Vérification par email</h2>
          <p className="verification-text">
            Veuillez entrer le code à 6 chiffres envoyé à votre adresse email
          </p>
          
          {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
          
          <form onSubmit={handleSubmit} className="verification-form">
            <div className="code-inputs">
              {inputs.map((_, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e, index)}  // Ajout de l'événement onPaste
                  className="code-input"
                />
              ))}
            </div>
            
            <button type="submit" className="login-button">
              Vérifier
            </button>

            <p className="resend-text">
              Vous n'avez pas reçu de code? 
              <button onClick={handleResendCode} className="resend-link">
                Renvoyer
              </button>
            </p>
          </form>
        </div>
      </div>
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
    </div>
  );
}

export default Code;
