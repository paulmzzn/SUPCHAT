// middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
    console.error('Erreur détectée :', err);
    return res.status(500).json({ message: 'Une erreur est survenue', error: err.message });
  }