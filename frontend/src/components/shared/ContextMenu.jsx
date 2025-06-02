import React from "react";
import PropTypes from "prop-types";
import "./ContextMenu.css";

/**
 * Composant de menu contextuel générique et réutilisable
 * @param {Object} props - Propriétés du composant
 */
const ContextMenu = ({
  visible,
  x,
  y,
  items,
  onClose,
  className = "",
  zIndex = 2000,
}) => {
  if (!visible || !items || items.length === 0) return null;

  return (
    <>
      {/* Menu contextuel */}
      <div
        className={`context-menu ${className}`}
        style={{
          top: y,
          left: x,
          zIndex,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => {
          if (item.type === "separator") {
            return <div key={index} className="context-menu-separator" />;
          }

          if (item.hidden) {
            return null;
          }

          return (
            <div
              key={index}
              className={`context-menu-item ${item.variant || ""} ${
                item.disabled ? "disabled" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.disabled && item.onClick) {
                  item.onClick();
                }
                if (onClose && !item.keepOpen) {
                  onClose();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                  }
                  if (onClose && !item.keepOpen) {
                    onClose();
                  }
                }
              }}
              tabIndex={item.disabled ? -1 : 0}
              role="button"
              title={item.tooltip}
            >
              {item.icon && (
                <span className="context-menu-icon">{item.icon}</span>
              )}
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Overlay pour fermer le menu */}
      <div className="context-menu-overlay" onClick={onClose} />
    </>
  );
};

ContextMenu.propTypes = {
  visible: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(["item", "separator"]),
      label: PropTypes.string,
      icon: PropTypes.element,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(["danger", "primary", "secondary"]),
      disabled: PropTypes.bool,
      hidden: PropTypes.bool,
      keepOpen: PropTypes.bool,
      tooltip: PropTypes.string,
      shortcut: PropTypes.string,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  zIndex: PropTypes.number,
};

export default ContextMenu;
