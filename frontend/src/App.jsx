import React, { useState } from 'react'
import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import HostGamePage from './components/HostGame';
import Game from './components/Game'
import Lobby from './components/Lobby';
import AboutUs from './components/AboutUs';

import { useNavigate, BrowserRouter as Router, Routes, Route, Link, useLocation} from "react-router-dom"
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute'
import ConnectionStatus from './components/ui/ConnectionStatus';
import EditUsers from './components/EditUsers';


function App() {
  return (
    
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
    
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
    setTimeout(() => navigate("/"), 0); {/* this allows navigate to home happen instead of ProtectedRoute redirecting to login */}
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
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:gamecode" element={<Game />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} /> {/* if admin not logged in */}
          <Route path="/waiting/:gamecode" element={<Lobby />} />
          <Route path="/game/:gamecode/:teamname" element={<Game />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'gamemaster']} />}>
            <Route path="/gameboard" element={<GameBoard />} />
            <Route path="/landing" element={<LandingPage />} /> {/* if admin logged in show link 'admin panel' or something */}
            <Route path="/hostgame" element={<HostGamePage />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/edit_users" element={<EditUsers />} />
          </Route>
        </Routes>
    </>
  )
}

export default App
