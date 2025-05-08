import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user data in localStorage on component mount
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (token && userId) {
      setUser({
        id: userId,
        token,
        name: userName || 'User',
      });
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Store user data in localStorage
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userId', userData.id);
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    }
    
    setUser(userData);
    return true;
  };

  const logout = () => {
    // Remove user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;