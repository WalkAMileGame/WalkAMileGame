import React, { useState } from 'react'
import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import HostGamePage from './components/HostGame';
import Game from './components/Game'

import { useNavigate, BrowserRouter as Router, Routes, Route, Link, useLocation} from "react-router-dom"
import { AuthProvider, useAuth } from './context/AuthContext';
import ConnectionStatus from './components/ui/ConnectionStatus';
import EditUsers from './components/EditUsers';


function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const padding = {padding: 5}
  const location = useLocation();
  const hideLinks = location.pathname.startsWith("/game/");
  const handleLogout = () => {
    logout();        
    navigate("/");   
  };

  return (
    <>
        <ConnectionStatus />
        {!hideLinks && (
        <div className="links">
          <Link style={padding} to="/">Home</Link>
          {user ? (
            <>
              <Link style={padding} to="/landing">{user.email}</Link>
              <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}  style={{
              background: "none",
              border: "none",
              color: hover ? "#F3A261": "white",
              textDecoration: "none",
              cursor: "pointer",
              padding: 5,
              font: "inherit",
            }} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link style={padding} to="/login">Login</Link>
          )}
        </div>
        )}
        <Routes>
          <Route path="/gameboard" element={<GameBoard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} /> {/* if admin not logged in */}
          <Route path="/landing" element={<LandingPage />} /> {/* if admin logged in show link 'admin panel' or something */}
          <Route path="/hostgame" element={<HostGamePage />} />
          <Route path="/game/:gamecode" element={<Game />} />
          <Route path="/editusers" element={<EditUsers />} />
        </Routes>
    </>
  )
}

export default App
