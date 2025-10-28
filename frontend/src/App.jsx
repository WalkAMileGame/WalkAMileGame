import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import HostGamePage from './components/HostGame';
import Game from './components/Game'

import {BrowserRouter as Router, Routes, Route, Link, useLocation} from "react-router-dom"
import ConnectionStatus from './components/ui/ConnectionStatus';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const hideLinks = location.pathname.startsWith("/game/");


  const padding = {
    padding: 5
  }

  return (
    <>
        <ConnectionStatus />
        {!hideLinks && (
        <div className="links">
          <Link style={padding} to="/">Home</Link>
          <Link style={padding} to="/gameboard">Gameboard</Link>
          <Link style={padding} to="/login">Login</Link>
        </div>
        )}
        <Routes>
          <Route path="/gameboard" element={<GameBoard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} /> {/* if admin not logged in */}
          <Route path="/landing" element={<LandingPage />} /> {/* if admin logged in show link 'admin panel' or something */}
          <Route path="/hostgame" element={<HostGamePage />} />
          <Route path="/game/:gamecode" element={<Game />} />
        </Routes>
    </>
  )
}

export default App
