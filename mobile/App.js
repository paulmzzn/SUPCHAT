import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext'; // Adjust path as necessary
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Import from new file
import { SocketProvider, useSocket } from './src/context/SocketContext'; // Ajout de cet import
import { UserPreferencesProvider } from './src/context/UserPreferencesContext'; // Import du contexte de préférences
import NotificationHandler from './src/components/NotificationHandler'; // Import du gestionnaire de notifications

// Auth screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import PasswordResetScreen from './src/screens/Auth/PasswordResetScreen';
import CodeVerificationScreen from './src/screens/Auth/CodeVerificationScreen';

// Main app screens
import WorkspacesScreen from './src/screens/Workspaces/WorkspacesScreen';
import WorkspaceScreen from './src/screens/WorkspaceDetail/WorkspaceDetailScreen';
import WorkspaceChannelsScreen from './src/screens/WorkspaceChannels/WorkspaceChannelsScreen';
import MessagesScreen from './src/screens/Messages/MessagesScreen';
import ConversationsListScreen from './src/screens/Messages/ConversationsListScreen';
import NewConversationScreen from './src/screens/Messages/NewConversationScreen';
import DiscoverScreen from './src/screens/Discover/DiscoverScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import ProfileEditScreen from './src/screens/Settings/ProfileEdit/ProfileEditScreen';

// Custom TabBar
import TabBar from './src/components/TabBar/TabBar'; 

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MessagesStack = createNativeStackNavigator(); // Create a stack for messages
const WorkspacesStack = createNativeStackNavigator(); // Create a stack for workspaces

// Messages Stack Navigator
function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <MessagesStack.Screen name="Conversation" component={MessagesScreen} />
      <MessagesStack.Screen name="NewConversation" component={NewConversationScreen} />
    </MessagesStack.Navigator>
  );
}

// Workspaces Stack Navigator
function WorkspacesNavigator() {
  return (
    <WorkspacesStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkspacesStack.Screen name="WorkspacesList" component={WorkspacesScreen} />
      <WorkspacesStack.Screen name="WorkspaceChannels" component={WorkspaceChannelsScreen} />
      <WorkspacesStack.Screen name="Workspace" component={WorkspaceScreen} />
    </WorkspacesStack.Navigator>
  );
}

// Tab Navigator for the main sections of the app
function AppTabs() {
  const { refreshUnreadCounts } = useSocket();
  
  // Forcer le chargement des notifications au démarrage
  React.useEffect(() => {
    console.log("AppTabs: Chargement initial des notifications");
    // Utiliser un délai court pour s'assurer que le contexte est complètement initialisé
    const timer = setTimeout(() => {
      refreshUnreadCounts();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [refreshUnreadCounts]);
  
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Workspaces" component={WorkspacesNavigator} options={{ headerShown: false }} />
      <Tab.Screen 
        name="Messages" 
        component={MessagesNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Auth stack for unauthenticated users
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <AuthStack.Screen name="CodeVerification" component={CodeVerificationScreen} />
    </AuthStack.Navigator>
  );
}

// Main app stack for authenticated users
function MainAppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="HomeTabs" component={AppTabs} />
      <AppStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </AppStack.Navigator>
  );
}

// Main navigation component with authentication state handling
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
      {userToken == null ? <AuthNavigator /> : (
        <>
          <NotificationHandler />
          <MainAppNavigator />
        </>
      )}
    </NavigationContainer>
  );
}

// Root App component
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserPreferencesProvider> {/* Ajout du provider des préférences utilisateur */}
          <SocketProvider>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </SocketProvider>
        </UserPreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
