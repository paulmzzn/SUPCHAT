import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Code from './pages/Code/Code';
import Dashboard from './pages/Dashboard/Dashboard';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import Validate from './pages/Validate/Validate';
import Workspaces from './pages/Workspaces/Workspaces';
import Discover from './pages/Discover/Discover';
import WorkspaceDetails from './pages/WorkspaceDetails/WorkspaceDetails';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  
  // Vérifier l'état de l'authentification au chargement de l'application
  useEffect(() => {
    // Simple check to ensure we wait for localStorage to be ready
    const token = localStorage.getItem('token');
    console.log("App.jsx - Token dans localStorage:", token ? token.substring(0, 15) + "..." : "non trouvé");
    setAuthChecked(true);
  }, []);
  
  // Fonction pour vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const isAuth = token !== null && token !== undefined;
    console.log("App.jsx - isAuthenticated:", isAuth);
    return isAuth;
  };

  // Composant amélioré pour les routes protégées
  const ProtectedRoute = ({ children }) => {
    // Vérifier directement localStorage à chaque rendu pour éviter les problèmes de synchronisation
    const isAuth = localStorage.getItem('token') !== null;
    
    if (!authChecked) {
      return <div>Vérification de l'authentification...</div>;
    }
    
    if (!isAuth) {
      console.log("ProtectedRoute - Redirection vers login car non authentifié");
      console.log("Token trouvé:", localStorage.getItem('token') ? "oui" : "non");
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  // Ne rien afficher jusqu'à ce que l'état de l'authentification soit vérifié
  if (!authChecked) {
    return <div>Chargement...</div>; // Ou un spinner de chargement
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/code" element={<Code email={localStorage.getItem('email')} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/workspaces" element={
          <ProtectedRoute>
            <Workspaces />
          </ProtectedRoute>
        } />
        <Route path="/workspace/:workspaceId" element={
          <ProtectedRoute>
            <WorkspaceDetails />
          </ProtectedRoute>
        } />
        <Route path="/discover" element={
          <ProtectedRoute>
            <Discover />
          </ProtectedRoute>
        } />
        <Route path="/validate" element={
          <ProtectedRoute>
            <Validate />
          </ProtectedRoute>
        } />
        
        {/* Route par défaut */}
        <Route path="/" element={
          isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
