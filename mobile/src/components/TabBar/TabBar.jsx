import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { getStyles } from './TabBar.styles';

const TabBar = ({ state, descriptors, navigation }) => {
  const { colors: themeColors } = useTheme();
  const { totalUnreadCount, unreadMessages, workspaceUnreadCounts } = useSocket();
  const styles = getStyles(themeColors);
  const insets = useSafeAreaInsets();
  
  // Animation pour l'indicateur actif
  const activeTabAnimation = React.useRef(new Animated.Value(state.index)).current;
  
  React.useEffect(() => {
    Animated.spring(activeTabAnimation, {
      toValue: state.index,
      useNativeDriver: false,
    }).start();
  }, [state.index]);

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
        return Object.values(unreadMessages || {}).reduce((sum, count) => sum + count, 0);
      case 'Workspaces':
        // Calculer le total des messages de workspace
        return Object.values(workspaceUnreadCounts || {}).reduce(
          (sum, workspace) => sum + (workspace.totalUnread || 0), 0
        );
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