import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import du composant TabBar personnalisé
import TabBar from '../components/TabBar/TabBar';

// Import des écrans (placeholders pour l'instant)
import MessagesScreen from '../screens/Messages/MessagesScreen';
import WorkspacesScreen from '../screens/Workspaces/WorkspacesScreen';
import DiscoverScreen from '../screens/Discover/DiscoverScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';

// Import the new screens
import ConversationsListScreen from '../screens/Messages/ConversationsListScreen';
import WorkspaceDetailScreen from '../screens/WorkspaceDetail/WorkspaceDetailScreen';
import WorkspaceChannelsScreen from '../screens/WorkspaceChannels/WorkspaceChannelsScreen';
import ChannelFilesScreen from '../screens/ChannelFiles/ChannelFilesScreen';
import WorkspaceSettingsScreen from '../screens/WorkspaceSettings/WorkspaceSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// In the MessagesStack
const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
    <Stack.Screen name="Conversation" component={MessagesScreen} />
  </Stack.Navigator>
);

// Stack pour les workspaces
const WorkspacesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WorkspacesList" component={WorkspacesScreen} />
    <Stack.Screen name="WorkspaceChannels" component={WorkspaceChannelsScreen} />
    <Stack.Screen name="WorkspaceDetail" component={WorkspaceDetailScreen} />
    <Stack.Screen name="ChannelFiles" component={ChannelFilesScreen} />
    <Stack.Screen name="WorkspaceSettings" component={WorkspaceSettingsScreen} />
  </Stack.Navigator>
);

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
        component={MessagesStack}
        initialParams={{ unreadCount: 0 }} // Exemple pour démontrer les badges
      />
      <Tab.Screen 
        name="Workspaces" 
        component={WorkspacesStack} 
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