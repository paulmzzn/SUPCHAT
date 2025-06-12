// Service Worker pour les notifications push SUPCHAT
const CACHE_NAME = 'supchat-notifications-v1';

// Détecter automatiquement l'URL d'API basée sur l'environnement
const getApiUrl = () => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return 'http://185.98.137.166:3001';
};

const API_BASE_URL = getApiUrl();

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/logo192.png',
        '/manifest.json'
      ]);
    })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Écouter les messages push
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'SUPCHAT',
    body: 'Vous avez reçu un nouveau message',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'supchat-message',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir SUPCHAT',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Ignorer'
      }
    ]
  };

  // Si des données sont envoyées avec la notification push
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: data.data || {}
      };
    } catch (e) {
      console.error('Erreur parsing données push:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Déterminer l'URL à ouvrir basé sur les données de la notification
  let targetUrl = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    
    if (data.type === 'private-message' && data.userId) {
      targetUrl = `/direct-messages?userId=${data.userId}`;
    } else if (data.type === 'mention' && data.workspaceId && data.channelId) {
      targetUrl = `/workspace/${data.workspaceId}?channel=${data.channelId}`;
    } else if (data.url) {
      targetUrl = data.url;
    }
  }

  // Ouvrir ou mettre au premier plan SUPCHAT
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher un onglet SUPCHAT déjà ouvert
      for (const client of clientList) {
        if (client.url.includes('supchat') || client.url.includes('localhost') || client.url.includes('185.98.137.166')) {
          if ('focus' in client) {
            // Si l'URL cible est différente, naviguer vers celle-ci
            if (targetUrl !== '/') {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
      }
      
      // Si aucun onglet SUPCHAT ouvert, en ouvrir un nouveau
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Gestion des erreurs push et réabonnement automatique
self.addEventListener('pushsubscriptionchange', async (event) => {
  event.waitUntil(
    // Logique de réabonnement automatique
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null // Remplacer par votre clé VAPID si utilisée
    }).then(newSubscription => {
      // Envoyer le nouveau subscription au serveur
      // Cette partie devra être implémentée côté serveur
      return fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: newSubscription,
          userId: null // À récupérer depuis le stockage local si possible
        })
      });
    }).catch(error => {
      console.error('Erreur lors du réabonnement push:', error);
    })
  );
});

// Synchronisation en arrière-plan (optionnel)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    // Logique de synchronisation si nécessaire
  }
});

// Gestion des messages depuis l'application principale
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/logo192.png',
      badge: '/logo192.png',
      tag: tag || 'supchat-message',
      requireInteraction: true,
      data: data || {},
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/logo192.png'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ]
    });
  }
});
