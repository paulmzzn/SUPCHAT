import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Code from "./pages/Code/Code";
import AuthCallback from "./pages/AuthCallback/AuthCallback";
import Validate from "./pages/Validate/Validate";
import Workspaces from "./pages/Workspaces/Workspaces";
import Discover from "./pages/Discover/Discover";
import WorkspaceDetails from "./pages/WorkspaceDetails/WorkspaceDetails";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import DirectMessages from "./pages/DirectMessages"; // Utilisation du composant refactorisé via l'index.js
import JoinWorkspace from "./pages/JoinWorkspace/JoinWorkspace";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationSettingsProvider } from "./context/NotificationSettingsContext";
import SoundTest from "./pages/SoundTest/SoundTest";
import { AuthProvider } from "./context/AuthContext";
import Notifications from "./components/Notifications/Notifications";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import NotificationPermissionRequest from "./components/NotificationPermissionRequest/NotificationPermissionRequest"; // Nouveau composant
// Importer le ToastProvider pour l'utiliser au niveau de l'app
import ToastProvider from "./components/Toast/ToastProvider";
// Importer le GoogleDriveAuthProvider pour l'authentification persistante Google Drive
import { GoogleDriveAuthProvider } from "./contexts/GoogleDriveAuthContext";
import MobileRedirect from "./components/MobileRedirect/MobileRedirect";
import { isMobileDevice } from "./utils/deviceDetection";

import CGU from "./pages/Settings/CGU"; // Importer la page CGU
import serviceWorkerManager from "./utils/serviceWorkerManager";

// Fonction utilitaire pour déboguer les événements de statut utilisateur - temporaire
if (process.env.NODE_ENV === "development") {
  window.addEventListener("userStatusChanged", (event) => {
    console.log(
      "[App Debug] Événement userStatusChanged détecté:",
      event.detail
    );
  });

  // Ajouter une fonction globale pour tester le statut
  window.testUserStatus = (userId, status) => {
    console.log(
      `[Test] Émission manuelle d'un changement de statut: ${userId} -> ${status}`
    );
    const event = new CustomEvent("userStatusChanged", {
      detail: { userId, status },
    });
    window.dispatchEvent(event);
  };
}

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Vérifier l'état de l'authentification et la détection mobile au chargement de l'application
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Détecter si c'est un appareil mobile
    setIsMobile(isMobileDevice());
    // Enregistrer le service worker pour les notifications (desktop et mobile)
    serviceWorkerManager
      .registerServiceWorker()
      .then((registered) => {
        if (registered) {
          // Service Worker enregistré avec succès
        } else {
          // Échec de l'enregistrement du Service Worker
        }
      })
      .catch((error) => {
        console.error(
          "[App] Erreur lors de l'enregistrement du Service Worker:",
          error
        );
      });

    setAuthChecked(true);
  }, []);
  // Fonction pour vérifier si l'utilisateur est authentifié avec débogage renforcé
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
        } else {
          // Format du token non valide
        }
      } catch (e) {
        // Erreur lors du décodage du token
      }
    }
    const isAuth = token !== null && token !== undefined;
    return isAuth;
  };
  // Fonction complète qui vérifie à la fois le token ET la validation du code
  const isFullyAuthenticated = () => {
    const token = localStorage.getItem("token");
    const isValidated = localStorage.getItem("isValidated") === "true";
    return token !== null && token !== undefined && isValidated;
  };
  // Composant amélioré pour les routes protégées
  const ProtectedRoute = ({ children }) => {
    const isAuth = isAuthenticated();
    const isValidated = localStorage.getItem("isValidated") === "true";
    if (!authChecked) {
      return <div>Vérification de l'authentification...</div>;
    }
    if (!isAuth) {
      return <Navigate to="/login" replace />;
    }
    if (isAuth && !isValidated) {
      return <Navigate to="/code" replace />;
    }
    return children;
  }; // Ne rien afficher jusqu'à ce que l'état de l'authentification soit vérifié
  if (!authChecked) {
    return <div>Chargement...</div>; // Ou un spinner de chargement
  }

  // Redirection mobile
  if (isMobile) {
    return <MobileRedirect />;
  }
  return (
    <ThemeProvider>
      <NotificationSettingsProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              {/* Ajout du composant Notifications ici pour qu'il soit disponible sur toutes les pages */}
              <Notifications />
              <NotificationPermissionRequest /> {/* Nouveau composant global */}
              <Routes>
                {" "}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/code"
                  element={<Code email={localStorage.getItem("email")} />}
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/workspaces"
                  element={
                    <ProtectedRoute>
                      <Workspaces />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId"
                  element={
                    <ProtectedRoute>
                      <WorkspaceDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discover"
                  element={
                    <ProtectedRoute>
                      <Discover />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/validate"
                  element={
                    <ProtectedRoute>
                      <Validate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />{" "}
                <Route
                  path="/direct-messages"
                  element={
                    <ProtectedRoute>
                      <DirectMessages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sound-test"
                  element={
                    <ProtectedRoute>
                      <SoundTest />
                    </ProtectedRoute>
                  }
                />
                <Route path="/join-workspace" element={<JoinWorkspace />} />
                {/* Route par défaut modifiée pour vérifier aussi l'indicateur isValidated */}
                <Route
                  path="/"
                  element={
                    isAuthenticated() ? (
                      localStorage.getItem("isValidated") === "true" ? (
                        <Navigate to="/workspaces" />
                      ) : (
                        <Navigate to="/code" />
                      )
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                {/* Route CGU accessible publiquement */}
                <Route path="/cgu" element={<CGU />} />
              </Routes>{" "}
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </NotificationSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
