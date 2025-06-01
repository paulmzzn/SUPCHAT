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
import Dashboard from "./pages/Dashboard/Dashboard";
import AuthCallback from "./pages/AuthCallback/AuthCallback";
import Validate from "./pages/Validate/Validate";
import Workspaces from "./pages/Workspaces/Workspaces";
import Discover from "./pages/Discover/Discover";
import WorkspaceDetails from "./pages/WorkspaceDetails/WorkspaceDetails";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import DirectMessages from "./pages/DirectMessages/DirectMessages";
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

import CGUPage from "./pages/CGUPage";

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

  // Vérifier l'état de l'authentification au chargement de l'application
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(
      "[App.jsx] useEffect - Token dans localStorage:",
      token ? token.substring(0, 15) + "..." : "non trouvé"
    );
    setAuthChecked(true);
  }, []);

  // Fonction pour vérifier si l'utilisateur est authentifié avec débogage renforcé
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    console.log("[App.jsx] isAuthenticated() appelé");
    console.log("- Token présent:", token ? "Oui" : "Non");
    if (token) {
      console.log("- Début du token:", token.substring(0, 20) + "...");
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log("- Payload du token:", payload);
          console.log(
            "- Expiration:",
            new Date(payload.exp * 1000).toLocaleString()
          );
          console.log(
            "- Token expiré:",
            Date.now() > payload.exp * 1000 ? "Oui" : "Non"
          );
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

  // Fonction complète qui vérifie à la fois le token ET la validation du code
  const isFullyAuthenticated = () => {
    const token = localStorage.getItem("token");
    const isValidated = localStorage.getItem("isValidated") === "true";
    console.log("[App.jsx] isFullyAuthenticated() appelé");
    console.log("- Token présent:", token ? "Oui" : "Non");
    console.log("- Code validé:", isValidated ? "Oui" : "Non");
    return (token !== null && token !== undefined) && isValidated;
  };

  // Composant amélioré pour les routes protégées
  const ProtectedRoute = ({ children }) => {
    const isAuth = isAuthenticated();
    const isValidated = localStorage.getItem("isValidated") === "true";
    console.log(
      "[App.jsx] ProtectedRoute rendu - authChecked:",
      authChecked,
      ", isAuth:",
      isAuth,
      ", isValidated:",
      isValidated
    );
    if (!authChecked) {
      console.log(
        "[App.jsx] ProtectedRoute - En attente de la vérification d'authentification"
      );
      return <div>Vérification de l'authentification...</div>;
    }
    if (!isAuth) {
      console.log(
        "[App.jsx] ProtectedRoute - Redirection vers login car non authentifié"
      );
      return <Navigate to="/login" replace />;
    }
    if (isAuth && !isValidated) {
      console.log(
        "[App.jsx] ProtectedRoute - Redirection vers /code car authentifié mais code non validé"
      );
      return <Navigate to="/code" replace />;
    }
    console.log(
      "[App.jsx] ProtectedRoute - Utilisateur authentifié, affichage du contenu protégé"
    );
    return children;
  };

  // Ne rien afficher jusqu'à ce que l'état de l'authentification soit vérifié
  if (!authChecked) {
    console.log("[App.jsx] Rendu global - authChecked pas encore prêt");
    return <div>Chargement...</div>; // Ou un spinner de chargement
  }

  console.log("[App.jsx] Rendu global - authChecked prêt, rendu des routes");
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
                <Route
                  path="/login"
                  element={
                    <>
                      <Login />
                      <script>
                        {console.log("[App.jsx] Route /login rendue")}
                      </script>
                    </>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <>
                      <Register />
                      <script>
                        {console.log("[App.jsx] Route /register rendue")}
                      </script>
                    </>
                  }
                />
                <Route
                  path="/code"
                  element={
                    <>
                      <Code email={localStorage.getItem("email")} />
                      <script>
                        {console.log("[App.jsx] Route /code rendue")}
                      </script>
                    </>
                  }
                />
                <Route
                  path="/auth/callback"
                  element={
                    <>
                      <AuthCallback />
                      <script>
                        {console.log("[App.jsx] Route /auth/callback rendue")}
                      </script>
                    </>
                  }
                />
                {/* Routes protégées */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /dashboard protégée rendue"
                      )}
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspaces"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /workspaces protégée rendue"
                      )}
                      <Workspaces />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /workspace/:workspaceId protégée rendue"
                      )}
                      <WorkspaceDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discover"
                  element={
                    <ProtectedRoute>
                      {console.log("[App.jsx] Route /discover protégée rendue")}
                      <Discover />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/validate"
                  element={
                    <ProtectedRoute>
                      {console.log("[App.jsx] Route /validate protégée rendue")}
                      <Validate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      {console.log("[App.jsx] Route /settings protégée rendue")}
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /profile/:userId protégée rendue"
                      )}
                      <Profile />
                    </ProtectedRoute>
                  }
                />{" "}
                <Route
                  path="/direct-messages"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /direct-messages protégée rendue"
                      )}
                      <DirectMessages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sound-test"
                  element={
                    <ProtectedRoute>
                      {console.log(
                        "[App.jsx] Route /sound-test protégée rendue"
                      )}
                      <SoundTest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/join-workspace"
                  element={
                    <>
                      <JoinWorkspace />
                      <script>
                        {console.log("[App.jsx] Route /join-workspace rendue")}
                      </script>
                    </>
                  }
                />
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
              </Routes>{" "}
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </NotificationSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
