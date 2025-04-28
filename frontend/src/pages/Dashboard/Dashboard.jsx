import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Dashboard.css';

function Dashboard() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [decodedToken, setDecodedToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Dashboard: Initialisation du composant");
    // Correction: utiliser 'token' au lieu de 'userToken'
    const token = localStorage.getItem('token');
    
    console.log("Dashboard: Token récupéré:", token ? "Présent" : "Absent");
    
    if (!token) {
      console.error("Dashboard: Token manquant, redirection vers login");
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("Dashboard: Token décodé avec succès:", decoded);
      setTokenInfo(token);
      setDecodedToken(decoded);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard: Erreur lors du décodage du token:', error);
      setError("Erreur d'authentification: " + error.message);
      // Plutôt que de rediriger immédiatement, afficher l'erreur
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log("Dashboard: Déconnexion");
    // Correction: utiliser 'token' au lieu de 'userToken'
    localStorage.removeItem('token');
    localStorage.removeItem('email'); // Aussi changer 'userEmail' en 'email' pour être cohérent
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="dashboard-container">
          <div className="loading-display">Chargement du dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="dashboard-container">
          <div className="error-display">{error}</div>
          <button onClick={() => navigate('/login')} className="error-login-button">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!decodedToken) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="dashboard-container">
          <div className="error-display">Problème d'authentification</div>
          <button onClick={() => navigate('/login')} className="error-login-button">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="app-title">
          SUPCHAT<span className="dot">.</span>
        </h1>
        
        <div className="dashboard-content">
          <div className="info-card">
            <h2>Informations du Token</h2>
            
            <div className="token-section">
              <h3>Token JWT :</h3>
              <div className="token-display">
                {tokenInfo ? tokenInfo.substring(0, 20) + "..." : "Non disponible"}
              </div>
            </div>

            <div className="decoded-section">
              <h3>Données décodées :</h3>
              <pre className="decoded-display">
                {decodedToken ? JSON.stringify(decodedToken, null, 2) : "Non disponible"}
              </pre>
            </div>

            <button onClick={handleLogout} className="logout-button">
              Se déconnecter
            </button>
          </div>
        </div>
        
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>
      </div>
    </div>
  );
}

export default Dashboard;
