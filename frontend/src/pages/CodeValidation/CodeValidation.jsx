import React from 'react';
import { useNavigate } from 'react-router-dom';
import CodeValidationForm from '../../components/shared/CodeValidationForm';
import './CodeValidation.css';

const CodeValidation = ({ email }) => {
  const navigate = useNavigate();

  const handleValidationSuccess = (data) => {
    // IMPORTANT: S'assurer que le token est bien sauvegardé avec le bon nom
    try {
      localStorage.setItem('token', data.token); // Utiliser 'token' comme clé
      localStorage.setItem('email', email || localStorage.getItem('email'));
      
      // Ajouter un indicateur de validation pour la sécurité
      localStorage.setItem('isValidated', 'true');
      
      // Attendre que localStorage soit mis à jour
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (storageError) {
      console.error("Erreur lors de la sauvegarde du token:", storageError);
    }
  };

  const handleValidationError = (error) => {
    console.error('Error during code validation:', error);
  };

  return (
    <div className="code-validation-container">
      <h2>Code de Validation</h2>
      <p>Veuillez entrer le code de validation envoyé à {email}</p>
      
      <CodeValidationForm
        email={email || localStorage.getItem('email')}
        onSuccess={handleValidationSuccess}
        onError={handleValidationError}
        submitButtonText="Valider"
        resendButtonText="Renvoyer"
        inputIdPrefix="code"
        className="code-validation-form"
      />
    </div>  );
};

export default CodeValidation;