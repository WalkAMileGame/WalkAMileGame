import {useEffect, useState } from 'react'
import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom"

function App() {

  const padding = {
    padding: 5
  }

  return (
    <>
      <Router>
        <div className="links">
          <Link style={padding} to="/">Home</Link>
          <Link style={padding} to="/gameboard">Gameboard</Link>
          <Link style={padding} to="/login">Login</Link>
        </div>

        <Routes>
          <Route path="/gameboard" element={<GameBoard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
