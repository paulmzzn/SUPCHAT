import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/account.css';

const Account = () => {
  const location = useLocation();
  const { user, token } = location.state || {};

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
