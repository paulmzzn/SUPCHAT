import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setUserToken(token);
      } catch (e) {
        console.error('Failed to get token during bootstrap', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContextValue = useMemo(
    () => ({
      signIn: async (token) => {
        try {
          await AsyncStorage.setItem('token', token);
          setUserToken(token);
        } catch (e) {
          console.error('Failed to save token during signIn', e);
        }
      },
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('email');
          setUserToken(null);
        } catch (e) {
          console.error('Failed to remove token during signOut', e);
        }
      },
      userToken,
      isLoading,
    }),
    [userToken, isLoading]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};