import React from "react"
import '../styles/HomePage.css';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Instructions from "./ui/Instructions";
import dudeIcon from '../assets/WAM_Element_3.png';



const HomePage = () => {  
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameCode, setGameCode] = useState('');

  const openInstructions = (e) => {
    e.preventDefault(); // prevent default link behavior
    setShowInstructions(true);
  };

  const handleJoinGame = () => {
    if (gameCode.trim()) {
      navigate(`/waiting/${gameCode}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinGame();
    }
  };

  const openAboutUs = (e) => {
    e.preventDefault(); // prevent default link behavior
    navigate("/about");
  };


    return (
      <div className="home-text">
        <header>
          <h1>WALK A MILE:</h1>
        </header>
        <hr></hr>
        <main>
          <h2>THE INTERNATIONAL PATH TO FINNISH EDUCATION</h2>
        </main>
        {/* Icon positioned on top of the arc */}
        <img src={dudeIcon} alt="Character" className="dude-icon" />
        

      <div className="half-circle">
        <svg viewBox="0 0 500 500">
          <path id="curve" fill="transparent" stroke="none" d="M73.2,115.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
            <text width="300" fontSize="15" fill="white" fontFamily="Lilita One, sans-serif">
              <textPath href="#curve" startOffset="50%" textAnchor="middle">
                <a href="#" style={{ fill: "white", textDecoration: "none" }} onClick={openAboutUs}>ABOUT US</a>
              </textPath>
            </text>
        </svg>
        <div className="half-circle1">
          <svg viewBox="0 0 500 500">
            <path id="curve" fill="transparent" stroke="none" d="M73.2,110.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
              <text width="300" fontSize="15" fill="white" fontFamily="Lilita One, sans-serif">
                <textPath href="#curve" startOffset="50%" textAnchor="middle">
                  <a href="#" style={{ fill: "white", textDecoration: "none" }} onClick={openInstructions}>INSTRUCTIONS</a>
                </textPath>
              </text>
        </svg>
        </div>
        <div className="half-circle2">
          <svg viewBox="0 0 500 500">
          <path id="curve" fill="transparent" stroke="none" d="M73.2,105.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
            <text width="300" fontSize="18" fill="white" fontFamily="Lilita One, sans-serif">
              <textPath href="#curve" startOffset="50%" textAnchor="middle">
                START
              </textPath>
            </text>
        </svg>
          <div className="start">
              <p>ENTER GAME CODE: </p>
                <input 
                  type="text" 
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC123"
                />
                <button onClick={handleJoinGame}>JOIN</button>
          </div>
          <Instructions
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
        </div>
        </div>
      </div>
  );
};

export default HomePage;
