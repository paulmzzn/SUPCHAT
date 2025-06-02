import React from "react";
import Modal from "../../components/shared/Modal";
import ChannelForm from "../../components/shared/ChannelForm";

function EditChannelModal({
  updateChannelError,
  editingChannel,
  isUpdatingChannel,
  setShowEditChannelModal,
  handleSubmitEditChannel,
  setEditingChannel,
}) {
  const handleClose = () => setShowEditChannelModal(false);

  return (
    <Modal 
      isOpen={true}
      onClose={handleClose}
      title="Modifier le canal"
    >
      <ChannelForm
        channel={editingChannel}
        onChannelChange={setEditingChannel}
        errorMessage={updateChannelError}
        isSubmitting={isUpdatingChannel}
        onSubmit={handleSubmitEditChannel}
        onCancel={handleClose}
        submitButtonText="Mettre à jour"
        submittingText="Mise à jour..."
      />
    </Modal>
  );
}

export default EditChannelModal;
