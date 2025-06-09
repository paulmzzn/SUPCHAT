class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
    this.isEnabled = false;
    this.init();
  }

  init() {
    if (!this.isSupported) {
      console.warn('Les notifications push ne sont pas supportées par ce navigateur');
      return;
    }

    this.permission = Notification.permission;
    this.isEnabled = this.permission === 'granted';
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Les notifications push ne sont pas supportées');
      return false;
    }

    if (this.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Les notifications ont été refusées par l\'utilisateur');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.isEnabled = permission === 'granted';
      
      if (permission === 'granted') {
        console.log('Permission accordée pour les notifications push');
        // Stocker la préférence dans localStorage
        localStorage.setItem('notifications_permission', 'granted');
      } else {
        console.log('Permission refusée pour les notifications push');
        localStorage.setItem('notifications_permission', 'denied');
      }
      
      return this.isEnabled;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (!this.isEnabled) {
      console.log('Notifications désactivées ou non autorisées');
      return null;
    }

    // Vérifier si l'onglet est actif
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      console.log('Onglet actif, notification push ignorée');
      return null;
    }

    try {
      const defaultOptions = {
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'supchat-notification',
        requireInteraction: false,
        silent: false,
        ...options
      };

      const notification = new Notification(title, defaultOptions);

      // Auto-fermer après 5 secondes
      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 5000);

      // Gérer le clic sur la notification
      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
      return null;
    }
  }

  showPrivateMessageNotification(senderName, content, userId) {
    const title = `Nouveau message de ${senderName}`;
    const body = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return this.showNotification(title, {
      body,
      icon: '/logo192.png',
      tag: `private-message-${userId}`,
      onClick: () => {
        // Naviguer vers la conversation privée
        if (window.location.pathname !== '/direct-messages') {
          window.location.href = `/direct-messages?userId=${userId}`;
        }
      }
    });
  }

  showMentionNotification(workspaceName, channelName, content, senderName, workspaceId, channelId) {
    const title = `Mention dans ${workspaceName}`;
    const body = `${senderName} vous a mentionné dans #${channelName}: ${content.length > 80 ? content.substring(0, 80) + '...' : content}`;
    
    return this.showNotification(title, {
      body,
      icon: '/logo192.png',
      tag: `mention-${workspaceId}-${channelId}`,
      onClick: () => {
        // Naviguer vers le workspace et le canal
        if (window.location.pathname !== `/workspace/${workspaceId}`) {
          window.location.href = `/workspace/${workspaceId}?channel=${channelId}`;
        }
      }
    });
  }

  isNotificationEnabled() {
    return this.isEnabled;
  }

  getPermissionStatus() {
    return this.permission;
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;
