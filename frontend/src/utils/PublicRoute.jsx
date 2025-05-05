import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userToken') && localStorage.getItem('isValidated') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/direct-messages" />;
  }

  return children;
};

export default PublicRoute;
