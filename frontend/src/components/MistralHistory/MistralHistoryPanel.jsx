import React, { useState, useEffect } from 'react';
import { useMistral } from '../../hooks/useMistral';
import './MistralHistoryPanel.css';

const MistralHistoryPanel = ({ 
  isOpen, 
  onClose, 
  type, // 'channel' ou 'private'
  canalId = null,
  onQuestionSelect 
}) => {
  const { loading, error, getMistralHistory } = useMistral();
  const [history, setHistory] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, type, canalId]);

  const loadHistory = async () => {
    try {
      const result = await getMistralHistory(type, canalId, 100);
      if (result.success) {
        setHistory(result.history);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique Mistral:', err);
    }
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handleQuestionClick = (message) => {
    if (message.role === 'user' && onQuestionSelect) {
      onQuestionSelect(message.content);
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(selectedMessage?.messageId === message.messageId ? null : message);
  };

  if (!isOpen) return null;

  return (
    <div className="mistral-history-panel">
      <div className="mistral-history-overlay" onClick={onClose} />
      <div className="mistral-history-content">
        <div className="mistral-history-header">
          <h3>
            🤖 Historique Mistral AI
            {type === 'channel' ? ' - Canal' : ' - Messages privés'}
          </h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="mistral-history-body">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement de l'historique...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>Erreur: {error}</p>
              <button onClick={loadHistory} className="retry-button">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="empty-state">
              <p>Aucun historique trouvé avec Mistral AI.</p>
              <p>Commencez une conversation en mentionnant @Mistral AI!</p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="history-list">
              {history.map((message, index) => (
                <div
                  key={message.messageId || index}
                  className={`history-message ${message.role} ${
                    selectedMessage?.messageId === message.messageId ? 'selected' : ''
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="message-header">
                    <div className="message-author">
                      {message.role === 'assistant' ? (
                        <span className="mistral-badge">🤖 Mistral AI</span>
                      ) : (
                        <span className="user-badge">👤 {message.userName}</span>
                      )}
                    </div>
                    <div className="message-time">
                      {formatMessageDate(message.timestamp)}
                    </div>
                  </div>
                  
                  <div className="message-content">
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="message-actions">
                      <button
                        className="reuse-question-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionClick(message);
                        }}
                        title="Réutiliser cette question"
                      >
                        🔄 Reposer
                      </button>
                    </div>
                  )}

                  {selectedMessage?.messageId === message.messageId && (
                    <div className="message-details">
                      <div className="detail-item">
                        <strong>ID:</strong> {message.messageId}
                      </div>
                      <div className="detail-item">
                        <strong>Type:</strong> {message.role === 'assistant' ? 'Réponse Mistral' : 'Question utilisateur'}
                      </div>
                      <div className="detail-item">
                        <strong>Utilisateur:</strong> {message.userName}
                      </div>
                      <div className="detail-item">
                        <strong>Date complète:</strong> {new Date(message.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mistral-history-footer">
          <div className="footer-info">
            {history.length > 0 && (
              <span>{history.length} message{history.length > 1 ? 's' : ''} dans l'historique</span>
            )}
          </div>
          <div className="footer-actions">
            <button onClick={loadHistory} className="refresh-button">
              🔄 Actualiser
            </button>
            <button onClick={onClose} className="close-footer-button">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MistralHistoryPanel;
