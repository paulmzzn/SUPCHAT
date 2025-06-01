import React, { useState } from 'react';
import { FaBell, FaTrash, FaEdit, FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import './ReminderList.css';

function ReminderList({ 
  reminders = [], 
  currentUserId, 
  onDeleteReminder, 
  onEditReminder,
  loading = false 
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatReminderDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Check if date is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Demain à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Check if date is this week
    const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && daysDiff > 1) {
      return `${date.toLocaleDateString('fr-FR', { weekday: 'long' })} à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Standard format for dates further away
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isReminderPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const handleDeleteClick = (reminder) => {
    setDeleteConfirm(reminder.id);
  };

  const handleConfirmDelete = (reminderId) => {
    onDeleteReminder(reminderId);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const canModifyReminder = (reminder) => {
    return reminder.user_id === currentUserId && !isReminderPast(reminder.reminder_date);
  };

  if (loading) {
    return (
      <div className="reminder-list-loading">
        <div className="spinner"></div>
        <span>Chargement des rappels...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="reminder-list-empty">
        <FaBell className="empty-icon" />
        <p>Aucun rappel dans ce canal</p>
        <small>Créez votre premier rappel pour ne rien oublier !</small>
      </div>
    );
  }

  return (
    <div className="reminder-list">
      {reminders.map((reminder) => {
        const isPast = isReminderPast(reminder.reminder_date);
        const canModify = canModifyReminder(reminder);
        
        return (
          <div 
            key={reminder.id} 
            className={`reminder-item ${isPast ? 'past' : 'upcoming'} ${reminder.is_sent ? 'sent' : ''}`}
          >
            <div className="reminder-header">
              <div className="reminder-title-section">
                <FaBell className={`reminder-status-icon ${isPast ? 'past' : 'upcoming'}`} />
                <h4 className="reminder-title">{reminder.title}</h4>
                {reminder.is_sent && (
                  <span className="sent-badge">Envoyé</span>
                )}
              </div>
              
              {canModify && (
                <div className="reminder-actions">
                  <button
                    className="action-button edit-button"
                    onClick={() => onEditReminder(reminder)}
                    title="Modifier"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={() => handleDeleteClick(reminder)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            {reminder.description && (
              <p className="reminder-description">{reminder.description}</p>
            )}

            <div className="reminder-meta">
              <div className="reminder-datetime">
                <FaCalendarAlt className="meta-icon" />
                <span className={isPast ? 'past-date' : 'upcoming-date'}>
                  {formatReminderDate(reminder.reminder_date)}
                </span>
              </div>
              
              <div className="reminder-creator">
                <FaUser className="meta-icon" />
                <span>
                  {reminder.user_name}
                  {reminder.user_id === currentUserId && ' (vous)'}
                </span>
                {reminder.user_avatar && (
                  <img 
                    src={reminder.user_avatar} 
                    alt={reminder.user_name}
                    className="creator-avatar"
                  />
                )}
              </div>
            </div>

            {/* Delete confirmation */}
            {deleteConfirm === reminder.id && (
              <div className="delete-confirmation">
                <p>Êtes-vous sûr de vouloir supprimer ce rappel ?</p>
                <div className="confirmation-actions">
                  <button
                    className="confirm-delete"
                    onClick={() => handleConfirmDelete(reminder.id)}
                  >
                    Supprimer
                  </button>
                  <button
                    className="cancel-delete"
                    onClick={handleCancelDelete}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ReminderList;
