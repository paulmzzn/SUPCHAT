import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Text } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext'; // Adjust path as necessary

// Auth screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import PasswordResetScreen from './src/screens/Auth/PasswordResetScreen';
import CodeVerificationScreen from './src/screens/Auth/CodeVerificationScreen';

// Main app screens
import WorkspacesScreen from './src/screens/Workspaces/WorkspacesScreen';
import MessagesScreen from './src/screens/Messages/MessagesScreen';
import DiscoverScreen from './src/screens/Discover/DiscoverScreen'; // Import actual DiscoverScreen
import SettingsScreen from './src/screens/Settings/SettingsScreen'; // Import actual SettingsScreen

// Custom TabBar
import TabBar from './src/components/TabBar/TabBar'; 

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Tab Navigator for the authenticated part of the app
function AppTabs() {
  return (
    // Use your custom TabBar component
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Workspaces" component={WorkspacesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
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
    }),
    [userToken]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E28' }}>
        <ActivityIndicator size="large" color="#9348B7" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              {userToken == null ? (
                // Auth flow screens
                <>
                  <RootStack.Screen name="Login" component={LoginScreen} />
                  <RootStack.Screen name="Register" component={RegisterScreen} />
                  <RootStack.Screen name="PasswordReset" component={PasswordResetScreen} />
                  <RootStack.Screen name="CodeVerification" component={CodeVerificationScreen} />
                </>
              ) : (
                // App flow - now navigates to the Tab Navigator
                <RootStack.Screen name="AppTabs" component={AppTabs} />
              )}
            </RootStack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
