import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import du composant TabBar personnalisé
import TabBar from '../components/TabBar/TabBar';

// Import des écrans (placeholders pour l'instant)
import MessagesScreen from '../screens/Messages/MessagesScreen';
import WorkspacesScreen from '../screens/Workspaces/WorkspacesScreen';
import DiscoverScreen from '../screens/Discover/DiscoverScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigateur pour les utilisateurs authentifiés
const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        initialParams={{ unreadCount: 0 }} // Exemple pour démontrer les badges
      />
      <Tab.Screen 
        name="Workspaces" 
        component={WorkspacesScreen} 
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
    </Tab.Navigator>
  );
};

// Navigateur principal qui gère l'authentification
const AppNavigator = ({ isAuthenticated = false }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;