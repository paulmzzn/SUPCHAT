import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Dashboard.css';

function Dashboard() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [decodedToken, setDecodedToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setTokenInfo(token);
      setDecodedToken(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  if (!decodedToken) return <div>Loading...</div>;

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
                {tokenInfo}
              </div>
            </div>

            <div className="decoded-section">
              <h3>Données décodées :</h3>
              <pre className="decoded-display">
                {JSON.stringify(decodedToken, null, 2)}
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
