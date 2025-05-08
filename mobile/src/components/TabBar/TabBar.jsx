import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Animation pour l'indicateur actif
  const activeTabAnimation = React.useRef(new Animated.Value(state.index)).current;
  
  React.useEffect(() => {
    Animated.spring(activeTabAnimation, {
      toValue: state.index,
      useNativeDriver: true,
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
          switch (route.name) {
            case 'Messages':
              return <Ionicons name={isFocused ? "chatbubble" : "chatbubble-outline"} size={24} color={isFocused ? "#fff" : "rgba(255, 255, 255, 0.7)"} />;
            case 'Workspaces':
              return <MaterialIcons name="workspaces" size={24} color={isFocused ? "#fff" : "rgba(255, 255, 255, 0.7)"} />;
            case 'Discover':
              return <FontAwesome name="compass" size={24} color={isFocused ? "#fff" : "rgba(255, 255, 255, 0.7)"} />;
            case 'Settings':
              return <Ionicons name={isFocused ? "settings" : "settings-outline"} size={24} color={isFocused ? "#fff" : "rgba(255, 255, 255, 0.7)"} />;
            default:
              return <Ionicons name="help-circle" size={24} color={isFocused ? "#fff" : "rgba(255, 255, 255, 0.7)"} />;
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

        // Badge pour les notifications (pour illustrer le concept)
        const showBadge = route.name === 'Messages' && route.params?.unreadCount > 0;

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
                  <Text style={styles.badgeText}>{route.params.unreadCount}</Text>
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
      
      {/* Animation de l'indicateur actif */}
      <Animated.View 
        style={[
          styles.activeTabIndicator,
          {
            transform: [{ 
              translateX: activeTabAnimation.interpolate({
                inputRange: [0, state.routes.length - 1],
                outputRange: [0, (state.routes.length - 1) * (100 / state.routes.length)],
              })
            }],
            width: `${100 / state.routes.length}%`
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 40, 0.97)',
    backdropFilter: 'blur(10px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
    height: 50,
  },
  iconContainer: {
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#9348B7',
    bottom: 0,
    borderRadius: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 20,
    height: 3,
    backgroundColor: '#9348B7',
    borderRadius: 3,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(30, 30, 40, 1)',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default TabBar;