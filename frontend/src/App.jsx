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
import MobileRedirect from "./components/MobileRedirect/MobileRedirect";
import { isMobileDevice } from "./utils/deviceDetection";

import CGUPage from "./pages/Settings/CGU";

// Global status change events for development
if (process.env.NODE_ENV === "development") {
  window.addEventListener("userStatusChanged", (event) => {
    // Status change event handled
  });

  window.testUserStatus = (userId, status) => {
    const event = new CustomEvent("userStatusChanged", {
      detail: { userId, status },
    });
    window.dispatchEvent(event);
  };
}

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Check authentication state and mobile detection on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsMobile(isMobileDevice());
    setAuthChecked(true);
  }, []);
  // Function to check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = Date.now() > payload.exp * 1000;
          return !isExpired;
        }
      } catch (e) {
        return false;
      }
    }
    return token !== null && token !== undefined;
  };
  // Complete function that checks both token AND code validation
  const isFullyAuthenticated = () => {
    const token = localStorage.getItem("token");
    const isValidated = localStorage.getItem("isValidated") === "true";
    return token !== null && token !== undefined && isValidated;
  };
  // Enhanced component for protected routes
  const ProtectedRoute = ({ children }) => {
    const isAuth = isAuthenticated();
    const isValidated = localStorage.getItem("isValidated") === "true";
    
    if (!authChecked) {
      return <div>Checking authentication...</div>;
    }
    if (!isAuth) {
      return <Navigate to="/login" replace />;
    }
    if (isAuth && !isValidated) {
      return <Navigate to="/code" replace />;
    }
    return children;
  };  // Don't display anything until authentication state is checked
  if (!authChecked) {
    return <div>Loading...</div>; // Or a loading spinner
  }
  // Mobile redirection
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
              <Routes>                <Route path="/login" element={<Login />} />                <Route path="/register" element={<Register />} />                <Route 
                  path="/code" 
                  element={<Code email={localStorage.getItem("email")} />} 
                />                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* Routes protégées */}                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/workspaces"
                  element={
                    <ProtectedRoute>
                      <Workspaces />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/workspace/:workspaceId"
                  element={
                    <ProtectedRoute>
                      <WorkspaceDetails />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/discover"
                  element={
                    <ProtectedRoute>
                      <Discover />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/validate"
                  element={
                    <ProtectedRoute>
                      <Validate />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/direct-messages"
                  element={
                    <ProtectedRoute>
                      <DirectMessages />
                    </ProtectedRoute>
                  }
                />                <Route
                  path="/sound-test"
                  element={
                    <ProtectedRoute>
                      <SoundTest />
                    </ProtectedRoute>
                  }
                />                <Route path="/join-workspace" element={<JoinWorkspace />} />
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
