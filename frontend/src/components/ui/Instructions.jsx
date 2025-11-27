import React from "react";
import { useEffect, useState } from 'react'
import { createPortal } from "react-dom";
import { API_BASE } from "../../api";

const Instructions = ({ show, onClose, apiUrl = `${API_BASE}/instructions` }) => {
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
          border-radius: 10px;
          padding: 2%;
          max-width: 40vw;
          max-height: 80vh;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          font-family: "Montserrat", sans-serif;
          position: relative;
          font-size: 0.8vw;
          white-space: pre-line;
          font-style: bold;
          overflow-y: auto; 
          margin:20px;
        }



        .instructions-box h2 {
          margin-top: 0;
          margin-bottom: 1vh;
          font-family: "Lilita One", sans-serif;
          font-size: 2vw;
          color: #E76F51;
          text-align: center;
        }
        

        .instructions-close {
          position: absolute;
          top: 1.5vh;
          right: 1vw;
          background: none;
          border: none;
          font-size: 1.2vw;
          cursor: pointer;
          color: #333;
        }

        .text {
          padding: 0 3%;
          color: #525252ff
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
          <div className="text">
            <p dangerouslySetInnerHTML={{ __html: instructionsText }} />
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
};

export default Instructions;
