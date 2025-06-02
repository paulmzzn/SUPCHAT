/**
 * Utilitaires partagés pour la validation de codes à 6 chiffres
 * Remplace la logique dupliquée dans Code.jsx, Validate.jsx, CodeValidation.jsx
 */

/**
 * Gère le changement d'un caractère dans un input de code
 * @param {string} value - La nouvelle valeur
 * @param {number} index - L'index de l'input
 * @param {Array} currentCode - Le code actuel
 * @param {Function} setCode - Fonction pour mettre à jour le code
 * @param {string} inputIdPrefix - Préfixe des IDs des inputs (ex: 'code', 'validate')
 */
export const handleCodeChange = (value, index, currentCode, setCode, inputIdPrefix = 'code') => {
  // Gestion du collage (paste)
  if (value.length > 1) {
    const pastedValue = value.replace(/\D/g, '').slice(0, 6); // Ne garde que les chiffres
    const codeArray = pastedValue.split('').slice(0, 6);
    // Remplir le reste avec des chaînes vides si nécessaire
    while (codeArray.length < 6) {
      codeArray.push('');
    }
    setCode(codeArray);
    // Focus sur le dernier input avec du contenu ou le dernier input
    const lastIndex = Math.min(pastedValue.length - 1, 5);
    const lastInput = document.getElementById(`${inputIdPrefix}-${lastIndex}`);
    if (lastInput) lastInput.focus();
    return;
  }

  // Gestion normale pour un seul caractère
  const newCode = [...currentCode];
  newCode[index] = value;
  setCode(newCode);

  // Passer au champ suivant si on a saisi un caractère
  if (value && index < 5) {
    const nextInput = document.getElementById(`${inputIdPrefix}-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

/**
 * Gère la navigation avec la touche Backspace
 * @param {KeyboardEvent} e - L'événement clavier
 * @param {number} index - L'index de l'input
 * @param {Array} currentCode - Le code actuel
 * @param {string} inputIdPrefix - Préfixe des IDs des inputs
 */
export const handleKeyDown = (e, index, currentCode, inputIdPrefix = 'code') => {
  if (e.key === 'Backspace' && !currentCode[index] && index > 0) {
    const prevInput = document.getElementById(`${inputIdPrefix}-${index - 1}`);
    if (prevInput) prevInput.focus();
  }
};

/**
 * Gère l'événement de collage
 * @param {ClipboardEvent} e - L'événement de collage
 * @param {Function} setCode - Fonction pour mettre à jour le code
 * @param {string} inputIdPrefix - Préfixe des IDs des inputs
 */
export const handlePaste = (e, setCode, inputIdPrefix = 'code') => {
  e.preventDefault();
  const pastedData = e.clipboardData
    .getData('text')
    .replace(/\D/g, '')
    .slice(0, 6);
  const codeArray = pastedData.split('');
  while (codeArray.length < 6) {
    codeArray.push('');
  }
  setCode(codeArray);
  // Focus sur le dernier input
  const lastInput = document.getElementById(`${inputIdPrefix}-5`);
  if (lastInput) lastInput.focus();
};

/**
 * Valide un code de 6 chiffres
 * @param {Array} code - Le code à valider
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateCode = (code) => {
  const codeString = code.join('');
  if (codeString.length !== 6) {
    return {
      isValid: false,
      message: 'Veuillez entrer le code complet à 6 chiffres'
    };
  }
  if (!/^\d{6}$/.test(codeString)) {
    return {
      isValid: false,
      message: 'Le code doit contenir uniquement des chiffres'
    };
  }
  return {
    isValid: true,
    message: ''
  };
};

/**
 * Envoie une requête de validation de code
 * @param {string} email - L'email de l'utilisateur
 * @param {string} code - Le code de validation
 * @param {string} apiUrl - L'URL de l'API
 * @returns {Promise} - La réponse de l'API
 */
export const submitValidationCode = async (email, code, apiUrl) => {
  const response = await fetch(`${apiUrl}/api/users/validate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      code,
    }),
  });

  const data = await response.json();
  return { response, data };
};

/**
 * Envoie une requête de renvoi de code
 * @param {string} email - L'email de l'utilisateur
 * @param {string} apiUrl - L'URL de l'API
 * @returns {Promise} - La réponse de l'API
 */
export const resendValidationCode = async (email, apiUrl) => {
  const response = await fetch(`${apiUrl}/api/users/resend-validation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  return { response, data };
};
