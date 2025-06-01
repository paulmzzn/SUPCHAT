import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Composant qui fournit le ToastContainer à l'application.
 * En séparant ce composant, on évite les problèmes de hooks React
 * liés à l'importation multiple de react-toastify.
 */
const ToastProvider = () => {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default ToastProvider;
