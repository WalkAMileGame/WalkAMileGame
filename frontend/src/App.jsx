import {useEffect, useState } from 'react'
import myLogo from './assets/GB.png'
import './App.css'

function App() {
  const [points, setPoints] = useState(0)

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
        <button onClick={updatingPoints}>
          Remaining energypoints: {points}
        </button>

      </div>
      <div>
        <img src={myLogo} className="logo" alt="My Logo" />
      </div>
    </>
  )
}

export default App
