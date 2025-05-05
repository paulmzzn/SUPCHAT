import React from "react";
import StrawpollModal from "../../components/Strawpoll/StrawpollModal";

function StrawpollModalWrapper({ show, onClose, onSubmit }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <StrawpollModal onClose={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

export default StrawpollModalWrapper;
