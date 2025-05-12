import React from "react";
import { FaTimes } from "react-icons/fa";
import StrawpollModal from "../../components/Strawpoll/StrawpollModal";
import "./StrawpollModalWrapper.css";

function StrawpollModalWrapper({ show, onClose, onSubmit }) {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <StrawpollModal onClose={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

export default StrawpollModalWrapper;
