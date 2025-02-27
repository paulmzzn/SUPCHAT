import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userToken') && localStorage.getItem('isValidated');

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
