import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Récupérer le token et l'état de validation
  const token = localStorage.getItem('userToken') || localStorage.getItem('token');
  const isValidated = localStorage.getItem('isValidated') === 'true';

  // Vérifier à la fois le token et la validation
  if (!token) {
    // Pas de token, rediriger vers login
    return <Navigate to="/login" replace />;
  } else if (token && !isValidated) {
    // Token mais pas validé, rediriger vers la page de validation
    return <Navigate to="/code" replace />;
  }
  
  // Token et validé, afficher le contenu protégé
  return children;
};

export default ProtectedRoute;
