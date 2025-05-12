import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import du composant TabBar personnalisé
import TabBar from '../components/TabBar/TabBar';

// Import des écrans d'authentification
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CodeVerificationScreen from '../screens/Auth/CodeVerificationScreen';
import PasswordResetScreen from '../screens/Auth/PasswordResetScreen';
import AuthCallbackScreen from '../screens/Auth/AuthCallbackScreen';

// Import des écrans principaux (Tabs)
import MessagesScreen from '../screens/Messages/MessagesScreen';
import WorkspacesScreen from '../screens/Workspaces/WorkspacesScreen';
import DiscoverScreen from '../screens/Discover/DiscoverScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

// Import de l'écran de modification de profil
import EditProfileScreen from '../screens/Profile/EditProfileScreen';

// Hooks pour l'authentification et le thème
import { useAuth } from '../../App';
import { useTheme } from '../theme/ThemeContext';

const RootStack = createStackNavigator();
const AuthFlowStack = createStackNavigator();
const SettingsTabStack = createStackNavigator();
const MainAppTab = createBottomTabNavigator();

// Create a unified settings navigator wrapper
function SettingsNavigator() {
  return (
    <SettingsTabStack.Navigator>
      <SettingsTabStack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ headerShown: false }} 
      />
      <SettingsTabStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false }} 
      />
    </SettingsTabStack.Navigator>
  );
}

// Navigateur pour les onglets principaux après authentification
function AppTabs() {
  return (
    <MainAppTab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainAppTab.Screen 
        name="Messages" 
        component={MessagesScreen}
        initialParams={{ unreadCount: 0 }}
      />
      <MainAppTab.Screen 
        name="Workspaces" 
        component={WorkspacesScreen} 
      />
      <MainAppTab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
      />
      <MainAppTab.Screen 
        name="Settings" 
        component={SettingsNavigator} // Direct reference to our navigator function
      />
    </MainAppTab.Navigator>
  );
}

// Navigateur pour le flux d'authentification
function AuthStackNavigator() {
  return (
    <AuthFlowStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthFlowStack.Screen name="Login" component={LoginScreen} />
      <AuthFlowStack.Screen name="Register" component={RegisterScreen} />
      <AuthFlowStack.Screen name="CodeVerification" component={CodeVerificationScreen} />
      <AuthFlowStack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <AuthFlowStack.Screen name="AuthCallback" component={AuthCallbackScreen} />
    </AuthFlowStack.Navigator>
  );
}

// Navigateur principal qui gère l'authentification
const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
        ) : (
          <RootStack.Screen name="App" component={AppTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;