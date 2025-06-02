import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

class MessageService {
  // Envoyer un message dans un canal
  async sendMessage(channelId, content, parentId = null, attachments = []) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Validation des paramètres avant envoi
      if (!channelId) {
        throw new Error('channelId est requis');
      }
      
      if (!content && (!attachments || attachments.length === 0)) {
        throw new Error('Le contenu ou des pièces jointes sont requis');
      }
      
      const messageData = {
        fk_canal: channelId,
        contenu: content || '',
        parent_id: parentId,
        attachments: attachments
      };

      console.log('📤 Envoi du message:', {
        url: `${env.API_URL}/api/messages`,
        messageData,
        token: token ? 'présent' : 'absent',
        contentLength: content ? content.length : 0
      });

      const response = await fetch(`${env.API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      console.log('📥 Réponse du serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Détails de l\'erreur serveur:', errorData);
        } catch (parseError) {
          // Si on ne peut pas parser la réponse en JSON, utiliser le texte
          try {
            const errorText = await response.text();
            console.error('❌ Réponse d\'erreur (texte):', errorText);
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error('❌ Impossible de lire la réponse d\'erreur:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Message envoyé avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', {
        error: error.message,
        channelId,
        contentLength: content ? content.length : 0,
        hasAttachments: attachments && attachments.length > 0
      });
      throw error;
    }
  }

  // Récupérer les messages d'un canal
  async getMessages(channelId, limit = 20, offset = 0) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const url = new URL(`${env.API_URL}/api/messages/canal/${channelId}`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  // Mettre à jour un message
  async updateMessage(messageId, content) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${env.API_URL}/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contenu: content
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
      throw error;
    }
  }

  // Supprimer un message
  async deleteMessage(messageId) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${env.API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw error;
    }
  }

  // Marquer un message comme lu
  async markAsRead(messageId) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${env.API_URL}/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  // Récupérer le nombre de messages non lus
  async getUnreadCounts() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${env.API_URL}/api/messages/unread/counts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
      throw error;
    }
  }

  // Upload d'un fichier avec message
  async uploadFile(channelId, file, content = '') {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('canalId', channelId);
      if (content) {
        formData.append('contenu', content);
      }

      const response = await fetch(`${env.API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  }
}

export default new MessageService();