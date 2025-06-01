import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaCalendarAlt, FaClock } from 'react-icons/fa';
import './ReminderModal.css';

function ReminderModal({ 
  show, 
  onClose, 
  onSubmit, 
  canalId, 
  workspaceId,
  loading = false,
  editingReminder = null // New prop for editing mode
}) {  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: ''
  });
  const [error, setError] = useState('');

  // Effect to populate form when editing a reminder
  useEffect(() => {
    if (editingReminder) {
      const reminderDate = new Date(editingReminder.reminder_date);
      const dateStr = reminderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = reminderDate.toTimeString().slice(0, 5); // HH:MM format
      
      setFormData({
        title: editingReminder.title || '',
        description: editingReminder.description || '',
        reminder_date: dateStr,
        reminder_time: timeStr
      });
    } else {
      // Reset form for new reminder
      setFormData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_time: ''
      });
    }
    setError('');
  }, [editingReminder, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }
    
    if (!formData.reminder_date) {
      setError('La date est requise');
      return;
    }
    
    if (!formData.reminder_time) {
      setError('L\'heure est requise');
      return;
    }

    // Combine date and time
    const reminderDateTime = new Date(`${formData.reminder_date}T${formData.reminder_time}`);
    const now = new Date();
    
    if (reminderDateTime <= now) {
      setError('La date et l\'heure doivent être dans le futur');
      return;
    }

    // Prepare data for submission
    const reminderData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      reminder_date: reminderDateTime.toISOString(),
      canal_id: canalId,
      workspace_id: workspaceId
    };

    onSubmit(reminderData);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_time: ''
      });
      setError('');
      onClose();
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum time (now if date is today)
  const getMinTime = () => {
    const today = new Date();
    const selectedDate = new Date(formData.reminder_date);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1); // Add 1 minute to ensure it's in the future
      return now.toTimeString().slice(0, 5);
    }
    
    return '';
  };  if (!show) return null;

  return (
    <div className="modal-overlay reminder-modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content reminder-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >        <div className="reminder-modal-header">
          <div className="reminder-modal-title">
            <FaBell className="reminder-icon" />
            <h2>{editingReminder ? 'Modifier le rappel' : 'Créer un rappel'}</h2>
          </div>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reminder-form">
          <div className="form-group">
            <label htmlFor="title">
              Titre du rappel <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Entrez le titre du rappel..."
              maxLength={100}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optionnel)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Ajoutez une description détaillée..."
              rows={3}
              maxLength={500}
              disabled={loading}
            />
          </div>

          <div className="datetime-group">
            <div className="form-group date-group">
              <label htmlFor="reminder_date">
                <FaCalendarAlt className="input-icon" />
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="reminder_date"
                name="reminder_date"
                value={formData.reminder_date}
                onChange={handleInputChange}
                min={getMinDate()}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group time-group">
              <label htmlFor="reminder_time">
                <FaClock className="input-icon" />
                Heure <span className="required">*</span>
              </label>
              <input
                type="time"
                id="reminder_time"
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleInputChange}
                min={getMinTime()}
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </button>            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {editingReminder ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <FaBell />
                  {editingReminder ? 'Modifier le rappel' : 'Créer le rappel'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReminderModal;
