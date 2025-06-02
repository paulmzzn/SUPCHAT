import React from 'react';
import { FaBell } from 'react-icons/fa';
import Modal from '../shared/Modal';
import ReminderForm from '../shared/ReminderForm';
import './ReminderModal.css';

function ReminderModal({ 
  show, 
  onClose, 
  onSubmit, 
  canalId, 
  workspaceId,
  loading = false,
  editingReminder = null
}) {
  if (!show) return null;

  const title = (
    <div className="reminder-modal-title">
      <FaBell className="reminder-icon" />
      <span>{editingReminder ? 'Modifier le rappel' : 'Créer un rappel'}</span>
    </div>
  );

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title={title}
      className="reminder-modal"
    >
      <ReminderForm
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        editingReminder={editingReminder}
        canalId={canalId}
        workspaceId={workspaceId}
      />
    </Modal>
  );
}

export default ReminderModal;