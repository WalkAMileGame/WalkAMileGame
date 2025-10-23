// import {useEffect, useState } from 'react'
// import myLogo from './assets/GB.png'
import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import HostGamePage from './components/HostGame';

import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom"
import ConnectionStatus from './components/ConnectionStatus';

function App() {

  const padding = {
    padding: 5
  }

  return (
    <>
      <Router>
        <ConnectionStatus />
        <div className="links">
          <Link style={padding} to="/">Home</Link>
          <Link style={padding} to="/gameboard">Gameboard</Link>
          <Link style={padding} to="/login">Login</Link>
        </div>

        <Routes>
          <Route path="/gameboard" element={<GameBoard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} /> {/* if admin not logged in */}
          <Route path="/landing" element={<LandingPage />} /> {/* if admin logged in show link 'admin panel' or something */}
          <Route path="/hostgame" element={<HostGamePage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
