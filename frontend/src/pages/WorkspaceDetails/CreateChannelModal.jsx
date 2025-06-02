import React from "react";
import Modal from "../../components/shared/Modal";
import ChannelForm from "../../components/shared/ChannelForm";

function CreateChannelModal({
  channelError,
  newChannel,
  isCreatingChannel,
  handleCloseModal,
  handleSubmitChannel,
  handleChannelInputChange,
  setNewChannel,
}) {
  return (
    <Modal 
      isOpen={true}
      onClose={handleCloseModal}
      title="Nouveau canal"
    >
      <ChannelForm
        channel={newChannel}
        onChannelChange={setNewChannel}
        errorMessage={channelError}
        isSubmitting={isCreatingChannel}
        onSubmit={handleSubmitChannel}
        onCancel={handleCloseModal}
        submitButtonText="Créer le canal"
        submittingText="Création..."
      />
    </Modal>
  );
}

export default CreateChannelModal;
