import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { getStyles } from './TabBar.styles';

// Créer un émetteur d'événements simple pour React Native
const EventEmitter = {
  listeners: {},
  
  addListener: (eventName, callback) => {
    if (!EventEmitter.listeners[eventName]) {
      EventEmitter.listeners[eventName] = [];
    }
    EventEmitter.listeners[eventName].push(callback);
    return {
      remove: () => {
        const index = EventEmitter.listeners[eventName]?.indexOf(callback);
        if (index !== undefined && index !== -1) {
          EventEmitter.listeners[eventName].splice(index, 1);
        }
      }
    };
  },
  
  emit: (eventName, data) => {
    if (EventEmitter.listeners[eventName]) {
      EventEmitter.listeners[eventName].forEach(callback => callback(data));
    }
  }
};

// Exposer l'émetteur globalement (remplace window.addEventListener/dispatchEvent)
global.AppEvents = EventEmitter;

const TabBar = ({ state, descriptors, navigation }) => {
  const { colors: themeColors } = useTheme();
  const { totalUnreadCount, unreadMessages, workspaceUnreadCounts } = useSocket();
  const styles = getStyles(themeColors);
  const insets = useSafeAreaInsets();
  
  // State pour forcer le re-render
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const lastUpdateRef = React.useRef({ 
    timestamp: Date.now(),
    counts: { workspaces: 0, messages: 0 }
  });
  
  // Animation pour l'indicateur actif
  const activeTabAnimation = React.useRef(new Animated.Value(state.index)).current;
  
  React.useEffect(() => {
    Animated.spring(activeTabAnimation, {
      toValue: state.index,
      useNativeDriver: false,
    }).start();
  }, [state.index]);

  // Forcer le re-render quand les compteurs changent - ÉVITE LA BOUCLE INFINIE
  React.useEffect(() => {
    // Calculer les totaux actuels
    const workspaceTotal = Object.values(workspaceUnreadCounts || {}).reduce(
      (sum, workspace) => sum + (workspace.totalUnread || 0), 0
    );
    const messagesTotal = Object.values(unreadMessages || {}).reduce((sum, count) => sum + count, 0);
    
    // Seulement mettre à jour si les compteurs ont réellement changé
    if (workspaceTotal !== lastUpdateRef.current.counts.workspaces || 
        messagesTotal !== lastUpdateRef.current.counts.messages) {
      
      // Mettre à jour notre référence
      lastUpdateRef.current = {
        timestamp: Date.now(),
        counts: {
          workspaces: workspaceTotal,
          messages: messagesTotal
        }
      };
      
      console.log("🏷️ TabBar: Mise à jour significative des compteurs", { 
        workspaces: workspaceTotal, 
        messages: messagesTotal,
      });
      
      setForceUpdate(prev => prev + 1);
    }
  }, [workspaceUnreadCounts, unreadMessages]);

  // NOUVEAU: Écouter les événements personnalisés via notre EventEmitter - COMPATIBLE REACT NATIVE
  React.useEffect(() => {
    const handleUnreadCountsUpdate = (event) => {
      // Empêcher une mise à jour trop rapprochée (au moins 300ms d'écart)
      const now = Date.now();
      if (now - lastUpdateRef.current.timestamp < 300) {
        return;
      }
      
      console.log("🏷️ TabBar: Événement personnalisé de mise à jour reçu");
      lastUpdateRef.current.timestamp = now;
      setForceUpdate(prev => prev + 1);
    };

    // Utiliser notre émetteur d'événements au lieu de window.addEventListener
    const subscription = global.AppEvents.addListener('forceUnreadCountsUpdate', handleUnreadCountsUpdate);

    return () => {
      // Nettoyer l'écouteur
      subscription.remove();
    };
  }, []);

  // NOUVEAU: Forcer une mise à jour périodique - TEMPS PLUS LONG
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Rafraîchir seulement si la dernière mise à jour date de plus de 10 secondes
      const now = Date.now();
      if (now - lastUpdateRef.current.timestamp > 10000) {
        setForceUpdate(prev => prev + 1);
      }
    }, 15000); // Toutes les 15 secondes au lieu de 5

    return () => clearInterval(interval);
  }, []);

  const getTabIcon = (routeName, focused) => {
    const iconColor = focused ? themeColors.accentPrimary : themeColors.textSecondary;
    
    switch (routeName) {
      case 'Workspaces':
        return <MaterialIcons name="workspaces" size={24} color={iconColor} />;
      case 'Messages':
        const iconNameMessages = focused ? 'chatbubbles' : 'chatbubbles-outline';
        return <Ionicons name={iconNameMessages} size={24} color={iconColor} />;
      case 'Discover':
        const iconNameDiscover = focused ? 'compass' : 'compass-outline';
        return <Ionicons name={iconNameDiscover} size={24} color={iconColor} />;
      case 'Settings':
        const iconNameSettings = focused ? 'settings' : 'settings-outline';
        return <Ionicons name={iconNameSettings} size={24} color={iconColor} />;
      default:
        return <Ionicons name="help-outline" size={24} color={iconColor} />;
    }
  };

  const getBadgeCount = (routeName) => {
    switch (routeName) {
      case 'Messages':
        // Calculer le total des messages privés
        const privateCount = Object.values(unreadMessages || {}).reduce((sum, count) => sum + count, 0);
        return privateCount;
      case 'Workspaces':
        // Calculer le total des messages de workspace - AMÉLIORÉ
        const workspaceCount = Object.values(workspaceUnreadCounts || {}).reduce(
          (sum, workspace) => sum + (workspace.totalUnread || 0), 0
        );
        return workspaceCount;
      default:
        return 0;
    }
  };

  const renderBadge = (count) => {
    if (count <= 0) return null;
    
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const badgeCount = getBadgeCount(route.name);

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.6}
          >
            <View style={styles.iconContainer}>
              {getTabIcon(route.name, isFocused)}
              {renderBadge(badgeCount)}
            </View>
            
            {isFocused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabBar;