import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if user is authenticated (you can modify this logic based on your auth system)
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return token && userId;
  };

  if (!isAuthenticated()) {
    // Redirect to login page with the current location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
