import React from "react"
import { Link } from "react-router-dom";
import '../styles/LandingPage.css';



const LandingPage = () => {
    return (
      <div className="landing-text">
        <header>
          <h1>CONTROL PANEL</h1>
        </header>
        <hr></hr>
        <main>
          <h2>You can edit gameboard templates and host a game here</h2>
        </main>

        <div className="buttons">
            <Link to="/gameboard">
                <button>🎲 EDIT GAMEBOARDS</button>
            </Link>
            <Link to="/hostgame">
                <button>🕹️ HOST A GAME</button>
            </Link>
            <Link to="/landing/#">
                <button>👤 EDIT USERS</button> {/* This needs the admin authentication */}
            </Link>
        </div>


      </div>
  );
};

export default LandingPage;