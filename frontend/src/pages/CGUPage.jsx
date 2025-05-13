import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CGUPage.css";
import CGU from "./Settings/CGU"; // Utilisation du composant existant
import { useTheme } from "../context/ThemeContext"; // Import du contexte de thème

const CGUPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Récupération du thème actuel
  
  // Application de la classe du thème sur le conteneur
  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    
    // Nettoyage au démontage du composant
    return () => {
      document.documentElement.classList.remove('theme-dark', 'theme-light');
    };
  }, [theme]);

  return (
    <div className={`cgu-page-container ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>      <div className="cgu-page-header">
        <button 
          className="cgu-back-button"
          onClick={() => {
            // Revenir en arrière dans l'historique si possible ou retourner à la page des paramètres
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/settings');
            }
          }}
        >
          ← Retour
        </button>
      </div>
      <div className="cgu-page-content">
        <CGU />
      </div>
    </div>
  );
};

export default CGUPage;
