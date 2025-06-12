// Service d'enregistrement et gestion du Service Worker
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Vérifier le support des service workers
  isServiceWorkerSupported() {
    return this.isSupported;
  }

  // Enregistrer le service worker
  async registerServiceWorker() {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Écouter les mises à jour du service worker
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouveau Service Worker disponible
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      return false;
    }
  }

  // Obtenir l'enregistrement du service worker
  async getRegistration() {
    if (this.registration) {
      return this.registration;
    }

    if (this.isSupported) {
      this.registration = await navigator.serviceWorker.ready;
      return this.registration;
    }

    return null;
  }

  // Envoyer un message au service worker
  async sendMessageToSW(message) {
    const registration = await this.getRegistration();
    if (registration && registration.active) {
      try {
        // Nettoyer le message pour éviter les erreurs de clonage
        const cleanMessage = JSON.parse(JSON.stringify(message));
        registration.active.postMessage(cleanMessage);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message au SW:', error);
        throw error;
      }
    }
  }

  // Afficher une notification via le service worker
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      // Fallback vers les notifications normales
      if ('Notification' in window && Notification.permission === 'granted') {
        return new Notification(title, options);
      }
      return null;
    }

    try {
      // Nettoyer les options pour éviter les erreurs de clonage
      const cleanOptions = {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        badge: options.badge || '/logo192.png',
        tag: options.tag || 'supchat-notification',
        requireInteraction: Boolean(options.requireInteraction),
        silent: Boolean(options.silent),
        data: options.data || {}
      };

      await this.sendMessageToSW({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: String(title),
          ...cleanOptions
        }
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification SW:', error);
      return false;
    }
  }

  // Vérifier si le service worker est actif
  isActive() {
    return this.registration && this.registration.active;
  }

  // Désenregistrer le service worker (pour le debug)
  async unregister() {
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    }
    return false;
  }
}

// Instance singleton
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
