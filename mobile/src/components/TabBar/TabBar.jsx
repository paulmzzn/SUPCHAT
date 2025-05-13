import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme
import { useSocket } from '../../context/SocketContext'; // Import useSocket pour accéder directement aux notifications
import { getStyles } from './TabBar.styles'; // Import getStyles

const TabBar = ({ state, descriptors, navigation }) => {
  const { colors: themeColors } = useTheme(); // Use theme context
  const { totalUnreadCount } = useSocket(); // Accès direct au compteur de notifications
  const styles = getStyles(themeColors); // Get styles based on current theme
  const insets = useSafeAreaInsets();
  
  // Animation pour l'indicateur actif
  const activeTabAnimation = React.useRef(new Animated.Value(state.index)).current;
  
  React.useEffect(() => {
    Animated.spring(activeTabAnimation, {
      toValue: state.index,
      useNativeDriver: false, // Changed to false for layout properties like left/width if used for indicator
      speed: 12,
      bounciness: 5,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 10 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        // Détermine l'icône en fonction de la route
        const getIcon = () => {
          const iconColor = isFocused ? themeColors.textPrimary : themeColors.textSecondary;
          switch (route.name) {
            case 'Messages':
              return <Ionicons name={isFocused ? "chatbubble" : "chatbubble-outline"} size={24} color={iconColor} />;
            case 'Workspaces':
              return <MaterialIcons name="workspaces" size={24} color={iconColor} />;
            case 'Discover':
              return <FontAwesome name="compass" size={24} color={iconColor} />;
            case 'Settings':
              return <Ionicons name={isFocused ? "settings" : "settings-outline"} size={24} color={iconColor} />;
            default:
              return <Ionicons name="help-circle" size={24} color={iconColor} />;
          }
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Badge pour les notifications - maintenant en utilisant totalUnreadCount directement pour l'onglet Messages
        const showBadge = route.name === 'Messages' && totalUnreadCount > 0;

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              {getIcon()}
              
              {/* Badge de notification */}
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalUnreadCount}</Text>
                </View>
              )}
            </View>
            
            {/* Indicateur de l'onglet actif */}
            {isFocused && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabBar;