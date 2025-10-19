import React from "react";
import { useEffect, useState } from 'react'
import { createPortal } from "react-dom";

const Instructions = ({ show, onClose, apiUrl = "http://localhost:8000/instructions" }) => {
  const [instructionsText, setInstructionsText] = useState("");

  useEffect(() => {
    if (show) {
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => setInstructionsText(data.instructions))
        .catch((err) => console.error(err));
    }
  }, [apiUrl, show]);

  if (!show) return null;

  const popupContent = (
    <>
      <style>{`
        .instructions-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .instructions-box {
          background: #FAF9F6;
          color: black;
          border-radius: 12px;
          padding: 30px;
          width: 50vw;
          height: 40vw;
          max-width: 50vw;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          font-family: "Montserrat", sans-serif;
          text-align: center;
          position: relative;
          font-size: 20px;
          white-space: pre-line;
          font-style: bold;
        }



        .instructions-box h2 {
          margin-top: 0;
          margin-bottom: 4px;
          font-family: "Lilita One", sans-serif;
          font-size: 40px;
          color: #E76F51;
        }
        

        .instructions-close {
          position: absolute;
          top: 15px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #333;
        }
      `}</style>

      <div className="instructions-overlay" onClick={onClose}>
        <div
          className="instructions-box"
          onClick={(e) => e.stopPropagation()} 
        >
          <button className="instructions-close" onClick={onClose}>
            ✕
          </button>
          <h2>INSTRUCTIONS</h2>
          <hr></hr>
          <p dangerouslySetInnerHTML={{ __html: instructionsText }} />
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
};

export default Instructions;
