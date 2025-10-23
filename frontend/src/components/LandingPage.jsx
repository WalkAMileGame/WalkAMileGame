import React from "react"
import { Link } from "react-router-dom";
import '../styles/LandingPage.css';



const LandingPage = () => {
    return (
      <div className="landing-page">
        <div className="header-area">
        <header>
          <h1>DASHBOARD</h1>
        </header>
          <h2>You are logged in as username</h2>
        </div>
        <div className="content-area">
          <div className="cards">
            <div className="card">
              <div className="card-icon">⚙️</div>
              <h3>EDIT GAMEBOARDS</h3>
              <p>Edit gameboard templates or create new ones</p>
              <Link to="/gameboard">
                <button>Edit</button>
              </Link>
            </div>
            <div className="card">
              <div className="card-icon">🕹️</div>
              <h3>HOST A GAME</h3>
              <p>Start hosting a game here</p>
              <Link to="/hostgame">
                <button>Host</button>
              </Link>
            </div>
            <div className="card">
              <div className="card-icon">👤</div>
              <h3>MANAGE USERS</h3>
              <p>Create users and manage their permissions </p>
              <Link to="/landing/#">
                <button>Manage</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LandingPage;