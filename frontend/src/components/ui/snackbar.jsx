import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const Snackbar = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

const snackbarContent = (
    <>
      <style>{`
        .snackbar {
          visibility: hidden;
          min-width: 250px;
          max-width: 400px;
          background-color: #f7efefff;
          color: black;
          text-align: center;
          border-radius: 8px;
          padding: 16px 20px;
          position: fixed;
          z-index: 99999;
          top: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          font-size: 18px;
          line-height: 1.4;
          left: 50%;
          top: 20px;
          transform: translateX(-50%);
          border: 1px, solid, black;
        }
        .snackbar.show {
          visibility: visible;
          animation: slideInTop 0.3s ease-out, slideOutTop 0.3s ease-in 9.7s;
        }
        @keyframes slideInTop {
          from {
            top: -50px;
            opacity: 0;
          }
          to {
            top: 20px;
            opacity: 1;
          }
        }
        @keyframes slideOutTop {
          from {
            top: 20px;
            opacity: 1;
          }
          to {
            top: -50px;
            opacity: 0;
          }
        }
        .snackbar:hover {
          cursor: pointer;
        }
      `}</style>

      <div 
        className={`snackbar ${show ? "show" : ""}`}
        onClick={onClose}
        title="Click to dismiss"
      >
        {message}
      </div>
    </>
  );

  return show ? createPortal(snackbarContent, document.body) : null;
};

export default Snackbar;