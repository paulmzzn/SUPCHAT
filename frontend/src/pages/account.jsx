import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/account.css';

const Account = () => {
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [token, setToken] = useState(location.state?.token || null);

  useEffect(() => {
    if (!user || !token) {
      const queryParams = new URLSearchParams(location.search);
      const userParam = queryParams.get('user');
      const tokenParam = queryParams.get('token');
      if (userParam && tokenParam) {
        setUser(JSON.parse(userParam));
        setToken(tokenParam);
      }
    }
  }, [location.search, user, token]);

  if (!user || !token) {
    return <div>No user information available.</div>;
  }

  return (
    <div className="account-container">
      <h2>Account Information</h2>
      <div className="account-info">
        <p><strong>ID:</strong> {user.id_utilisateur}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Password:</strong> {user.mot_de_passe}</p>
        <p><strong>Token:</strong> {token}</p>
      </div>
    </div>
  );
};

export default Account;
