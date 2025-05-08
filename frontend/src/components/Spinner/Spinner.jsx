import React from "react";
import "./Spinner.css";

function Spinner({ size = "medium" }) {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner-circle"></div>
      <div className="spinner-circle-inner"></div>
    </div>
  );
}

export default Spinner;
