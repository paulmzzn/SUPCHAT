import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext'; // Adjust path as necessary
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Import from new file

// Auth screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import PasswordResetScreen from './src/screens/Auth/PasswordResetScreen';
import CodeVerificationScreen from './src/screens/Auth/CodeVerificationScreen';

// Main app screens
import WorkspacesScreen from './src/screens/Workspaces/WorkspacesScreen';
import MessagesScreen from './src/screens/Messages/MessagesScreen';
import DiscoverScreen from './src/screens/Discover/DiscoverScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';

// Custom TabBar
import TabBar from './src/components/TabBar/TabBar'; 

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for the authenticated part of the app
function AppTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Workspaces" component={WorkspacesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Main navigation component
function AppNavigator() {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E28' }}>
        <ActivityIndicator size="large" color="#9348B7" />
      </View>
    );
  }

  return (
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
  );
}

// Root App component
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
