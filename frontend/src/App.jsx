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
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';
import DirectMessages from './pages/DirectMessages/DirectMessages';
import { SocketProvider } from './context/SocketContext';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  
  // Vérifier l'état de l'authentification au chargement de l'application
  useEffect(() => {
    // Simple check to ensure we wait for localStorage to be ready
    const token = localStorage.getItem('token');
    console.log("App.jsx - Token dans localStorage:", token ? token.substring(0, 15) + "..." : "non trouvé");
    setAuthChecked(true);
  }, []);
  
  // Fonction pour vérifier si l'utilisateur est authentifié avec débogage renforcé
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    
    // Ajouter du logging détaillé pour le débogage
    console.log("Vérification d'authentification:");
    console.log("- Token présent:", token ? "Oui" : "Non");
    if (token) {
      console.log("- Début du token:", token.substring(0, 20) + "...");
      try {
        // Vérifier si le token est au format JWT valide
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log("- Payload du token:", payload);
          console.log("- Expiration:", new Date(payload.exp * 1000).toLocaleString());
          console.log("- Token expiré:", Date.now() > payload.exp * 1000 ? "Oui" : "Non");
        } else {
          console.log("- Format du token non valide");
        }
      } catch (e) {
        console.log("- Erreur lors du décodage du token:", e);
      }
    }
    
    const isAuth = token !== null && token !== undefined;
    console.log("- Résultat final isAuthenticated():", isAuth);
    return isAuth;
  };

  // Composant amélioré pour les routes protégées
  const ProtectedRoute = ({ children }) => {
    // Vérifier directement localStorage à chaque rendu
    const isAuth = isAuthenticated();
    
    if (!authChecked) {
      console.log("ProtectedRoute - En attente de la vérification d'authentification");
      return <div>Vérification de l'authentification...</div>;
    }
    
    if (!isAuth) {
      console.log("ProtectedRoute - Redirection vers login car non authentifié");
      return <Navigate to="/login" replace />;
    }
    
    console.log("ProtectedRoute - Utilisateur authentifié, affichage du contenu protégé");
    return children;
  };

  // Ne rien afficher jusqu'à ce que l'état de l'authentification soit vérifié
  if (!authChecked) {
    return <div>Chargement...</div>; // Ou un spinner de chargement
  }

  return (
    <SocketProvider>
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
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/direct-messages" element={<DirectMessages />} />
          
          {/* Route par défaut */}
          <Route path="/" element={
            isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
