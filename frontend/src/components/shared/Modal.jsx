/**
 * Composant modal réutilisable
 * Remplace la structure dupliquée dans tous les modaux de l'application
 */

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

const Modal = ({
  show,
  onClose,
  title,
  children,
  footer,
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  headerIcon = null
}) => {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const modalSizeClass = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large'
  }[size];

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${modalSizeClass} ${className}`} onClick={(e) => e.stopPropagation()}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            <div className="modal-title">
              {headerIcon && <span className="modal-header-icon">{headerIcon}</span>}
              <h2>{title}</h2>
            </div>
            {showCloseButton && (
              <button 
                className="modal-close-button" 
                onClick={handleClose}
                disabled={loading}
                type="button"
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Composants de boutons réutilisables pour les footers
export const ModalActions = ({ children, align = 'right' }) => (
  <div className={`modal-actions modal-actions-${align}`}>
    {children}
  </div>
);

export const ModalButton = ({ 
  variant = 'default', // 'default', 'primary', 'danger', 'success'
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  icon = null,
  ...props 
}) => {
  const buttonClass = `modal-button modal-button-${variant} modal-button-${size}`;
  
  return (
    <button 
      className={buttonClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="modal-button-spinner"></div>}
      {!loading && icon && <span className="modal-button-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Modal;
