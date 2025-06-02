/**
 * Composant complet de validation de code réutilisable
 * Inclut la logique de soumission, renvoi et gestion d'erreurs
 */

import React, { useState } from 'react';
import CodeInput from './CodeInput';
import { validateCode, submitValidationCode, resendValidationCode } from '../../utils/codeValidation';
import { API_URL } from '../../config/config';

const CodeValidationForm = ({
  email,
  onSuccess,
  onError,
  submitButtonText = 'Vérifier',
  resendButtonText = 'Renvoyer',
  inputIdPrefix = 'code',
  showResend = true,
  className = 'verification-form'
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation côté client
    const validation = validateCode(code);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (!email) {
      setError('Email non disponible. Veuillez vous reconnecter.');
      return;
    }

    setLoading(true);

    try {
      const validationCode = code.join('');
      const { response, data } = await submitValidationCode(email, validationCode, API_URL);

      if (response.ok) {
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const errorMessage = data.message || 'Code invalide';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = 'Erreur de connexion au serveur';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email non disponible. Veuillez vous reconnecter.');
      return;
    }

    try {
      const { response, data } = await resendValidationCode(email, API_URL);
      
      if (response.ok) {
        setError('');
        alert('Un nouveau code a été envoyé à votre email.');
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <CodeInput
        code={code}
        setCode={setCode}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        inputIdPrefix={inputIdPrefix}
      />

      <button type="submit" className="login-button" disabled={loading}>
        {loading ? 'Validation...' : submitButtonText}
      </button>

      {showResend && (
        <p className="resend-text">
          Vous n'avez pas reçu de code?
          <button
            type="button"
            onClick={handleResendCode}
            className="resend-link"
            disabled={loading}
          >
            {resendButtonText}
          </button>
        </p>
      )}
    </form>
  );
};

export default CodeValidationForm;
