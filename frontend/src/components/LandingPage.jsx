import React from "react"
import { Link } from "react-router-dom";
import '../styles/LandingPage.css';
import { useAuth } from "../context/AuthContext";
import board from '../assets/board.png'
import circumstance from '../assets/circumstance.png'
import host from '../assets/host.png'
import users from '../assets/users.png'



const LandingPage = () => {

  const { user } = useAuth();

    return (
      <div className="landing-page">
        <div className="header-area">
        <header>
          <h1>DASHBOARD</h1>
        </header>
          <h2>You are logged in as {user?.email}</h2>
        </div>
        <div className="content-area">
          <div className="cards">
            <div className="card">
              <img src={board} alt="Edit gameboards icon" className="card-icon" />
              <h3>EDIT GAMEBOARDS</h3>
              <p>Edit gameboard templates or create new ones</p>
              <Link to="/gameboard">
                <button>Edit</button>
              </Link>
            </div>
            <div className="card">
              <img src={host} alt="Host a game icon" className="card-icon" />
              <h3>HOST A GAME</h3>
              <p>Start hosting a game here</p>
              <Link to="/hostgame">
                <button>Host</button>
              </Link>
            </div>
             <div className="card">
              <img src={circumstance} alt="Edit circumstances icon" className="card-icon" />
              <h3>EDIT CIRCUMSTANCES</h3>
              <p>Edit and add new circumstances</p>
              <Link to="/circumstances">
                <button>Edit</button>
              </Link>
            </div>
            {user?.role === "admin" && (
            <div className="card">
              <img src={users} alt="Edit users icon" className="card-icon" />
              <h3>MANAGE USERS</h3>
              <p>Create users and manage their permissions </p>
              <Link to="/edit_users">
                <button>Manage</button>
              </Link>
            </div>            
            )}
          </div>
        </div>
      </div>
  );
};

export default LandingPage;