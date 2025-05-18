import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/config';
import './CodeValidation.css';

const CodeValidation = ({ email }) => {
  const [codes, setCodes] = useState(Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newCodes = [...codes];
      newCodes[index] = value;
      setCodes(newCodes);
      if (value !== '' && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const getCodeAsString = () => codes.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Utiliser l'email des props ou du localStorage
    const emailToUse = email || localStorage.getItem('email');
    
    if (!emailToUse) {
      setError("Email non disponible. Veuillez vous reconnecter.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log('Sending validation request:', { email: emailToUse, code: getCodeAsString() });
      const response = await fetch(`${API_URL}/api/users/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToUse, code: getCodeAsString() }),
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (response.ok) {
        // IMPORTANT: S'assurer que le token est bien sauvegardé avec le bon nom
        try {
          console.log("Sauvegarde du nouveau token après validation");
          localStorage.setItem('token', data.token); // Utiliser 'token' comme clé
          localStorage.setItem('email', emailToUse);
          
          // Ajouter un indicateur de validation pour la sécurité
          localStorage.setItem('isValidated', 'true');
          
          // Vérifier que le token est bien sauvegardé
          console.log("Token sauvegardé:", localStorage.getItem('token') ? "oui" : "non");
          console.log("Validation enregistrée:", localStorage.getItem('isValidated'));
          
          // Attendre que localStorage soit mis à jour
          setTimeout(() => {
            console.log("Navigation vers le dashboard");
            navigate('/dashboard', { replace: true });
          }, 100);
        } catch (storageError) {
          console.error("Erreur lors de la sauvegarde du token:", storageError);
          setError("Erreur lors de la sauvegarde des informations de session.");
        }
      } else {
        setError(data.message || 'Une erreur est survenue lors de la validation.');
        setCodes(Array(6).fill(''));
      }
    } catch (err) {
      console.error('Error during code validation:', err);
      setError('Une erreur de connexion est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="code-validation-container">
      <h2>Code de Validation</h2>
      <p>Veuillez entrer le code de validation envoyé à {email}</p>
      <form onSubmit={handleSubmit}>
        <div className="code-inputs">
          {codes.map((code, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength="1"
              value={code}
              onChange={(e) => handleChange(e, index)}
              required
            />
          ))}
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Validation en cours...' : 'Valider'}
        </button>
      </form>
    </div>
  );
};

export default CodeValidation;