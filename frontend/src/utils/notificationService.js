import serviceWorkerManager from './serviceWorkerManager.js';

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
    
    // Initialiser le service worker
    this.initServiceWorker();
  }

  async initServiceWorker() {
    if (serviceWorkerManager.isServiceWorkerSupported()) {
      await serviceWorkerManager.registerServiceWorker();
    }
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
        localStorage.setItem('notifications_permission', 'granted');
      } else {
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
      return null;
    }

    // Vérifier si l'onglet est actif (sauf si force = true)
    if (document.visibilityState === 'visible' && document.hasFocus() && !options.force) {
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

      // Supprimer 'force' et 'onClick' des options avant de les passer aux notifications
      const { force, onClick, ...notificationOptions } = defaultOptions;

      // Tenter d'utiliser le service worker en premier
      if (serviceWorkerManager.isServiceWorkerSupported() && serviceWorkerManager.isActive()) {
        const result = await serviceWorkerManager.showNotification(title, notificationOptions);
        if (result) {
          return result;
        }
      }

      // Fallback vers les notifications normales
      const notification = new Notification(title, notificationOptions);

      // Auto-fermer après 5 secondes
      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 5000);

      // Gérer le clic sur la notification
      notification.onclick = () => {
        window.focus();
        if (onClick) {
          onClick();
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
      data: { type: 'private-message', userId },
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
      data: { type: 'mention', workspaceId, channelId },
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
