import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSocket } from '../context/SocketContext';

const SocketDebugInfo = ({ visible = true }) => { // Changé visible par défaut à true
  const socketContext = useSocket(); // Récupérer tout le contexte
  const [debugInfo, setDebugInfo] = useState({});

  // Afficher les valeurs du contexte directement aussi
  console.log("🐛 SocketDebugInfo Context:", {
    isConnected: socketContext?.isConnected,
    socketId: socketContext?.socket?.id,
    currentUserId: socketContext?.currentUserId,
    workspaceCount: Object.keys(socketContext?.workspaceUnreadCounts || {}).length,
    hasGetDebugInfo: !!socketContext?.getDebugInfo
  });

  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      if (socketContext?.getDebugInfo) {
        const info = socketContext.getDebugInfo();
        setDebugInfo(info);
        console.log("=== WEBSOCKET DEBUG ===");
        console.log("Socket connected:", info.socketConnected);
        console.log("Socket ID:", info.socketId);
        console.log("Current user ID:", info.currentUserId);
        console.log("Workspaces:", info.workspaceCount);
        console.log("Channels:", info.channelCount);
        console.log("Private messages:", info.privateMessageCount);
        console.log("Total workspace unread:", info.totalWorkspaceUnread);
      } else {
        console.log("❌ getDebugInfo not available in context");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [visible, socketContext]);

  if (!visible) return null;

  // Utiliser les données directement du contexte si getDebugInfo n'est pas disponible
  const displayInfo = debugInfo.socketConnected !== undefined ? debugInfo : {
    socketConnected: socketContext?.isConnected || false,
    socketId: socketContext?.socket?.id || 'None',
    currentUserId: socketContext?.currentUserId || 'None',
    workspaceCount: Object.keys(socketContext?.workspaceUnreadCounts || {}).length,
    totalWorkspaceUnread: Object.values(socketContext?.workspaceUnreadCounts || {}).reduce(
      (sum, workspace) => sum + (workspace.totalUnread || 0), 0
    )
  };

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>Socket Debug</Text>
      <Text style={styles.debugText}>Connected: {displayInfo.socketConnected ? '✅ Yes' : '❌ No'}</Text>
      <Text style={styles.debugText}>Socket ID: {displayInfo.socketId || 'None'}</Text>
      <Text style={styles.debugText}>User ID: {displayInfo.currentUserId ? '✅ Set' : '❌ None'}</Text>
      <Text style={styles.debugText}>Workspaces: {displayInfo.workspaceCount || 0}</Text>
      <Text style={styles.debugText}>Total Unread: {displayInfo.totalWorkspaceUnread || 0}</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={() => {
          console.log("🔄 Socket: Force refreshing counts...");
          socketContext?.forceRefreshCounts && socketContext.forceRefreshCounts();
        }}
      >
        <Text style={styles.refreshButtonText}>Force Refresh</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.refreshButton, { backgroundColor: '#28A745' }]} 
        onPress={() => {
          console.log("🔍 Affichage state complet du contexte Socket:");
          console.log("📊 Full context:", socketContext);
        }}
      >
        <Text style={styles.refreshButtonText}>Log Context</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 60, // Ajusté pour être sous la barre de statut
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
    minWidth: 200,
  },
  debugTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  debugText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SocketDebugInfo;