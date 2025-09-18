import {useEffect, useState } from 'react'
// import myLogo from './assets/GB.png'
import HomePage from './components/HomePage';
import GameBoard from "./components/GameBoard";
import Login from './components/Login';
import './App.css'
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom"

function App() {
  const [points, setPoints] = useState(0)

  const padding = {
    padding: 5
  }

  useEffect(() => {
  fetch("http://localhost:8000/items")
    .then((res) => res.json())
    .then((data) => setPoints(data.values));
}, []);

  const updatingPoints = () => {
    fetch("http://localhost:8000/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change: -1 }), 
    })
      .then((res) => res.json())
      .then((data) => setPoints(data.values));
  };
  return (
    <>
      <div className="card">
          Remaining energypoints: {points}
      </div>
      <Router>
        <div>
          <Link style={padding} to="/">Home</Link>
          <Link style={padding} to="/gameboard">Gameboard</Link>
          <Link style={padding} to="/login">Login</Link>
        </div>

        <Routes>
          <Route path="/gameboard" element={<GameBoard points={points} onSliceClick={updatingPoints}/>} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
