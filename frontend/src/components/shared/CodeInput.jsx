/**
 * Composant réutilisable pour la saisie de codes à 6 chiffres
 * Remplace la logique dupliquée dans tous les composants de validation
 */

import React from 'react';
import { handleCodeChange, handleKeyDown, handlePaste } from '../../utils/codeValidation';

const CodeInput = ({
  code,
  setCode,
  onSubmit,
  loading = false,
  error = '',
  inputIdPrefix = 'code',
  className = 'code-inputs',
  inputClassName = 'code-input',
  disabled = false
}) => {
  const inputs = Array(6).fill(0);

  const handleChange = (index, value) => {
    handleCodeChange(value, index, code, setCode, inputIdPrefix);
  };

  const handleKeyPress = (e, index) => {
    handleKeyDown(e, index, code, inputIdPrefix);
  };

  const handlePasteEvent = (e) => {
    handlePaste(e, setCode, inputIdPrefix);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      <div className={className}>
        {inputs.map((_, index) => (
          <input
            key={index}
            id={`${inputIdPrefix}-${index}`}
            type="text"
            maxLength={1}
            value={code[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, index)}
            onPaste={handlePasteEvent}
            className={inputClassName}
            disabled={disabled || loading}
            autoComplete="off"
          />
        ))}
      </div>
    </form>
  );
};

export default CodeInput;
