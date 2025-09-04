import { useState } from 'react'
import myLogo from './assets/GB.png'
import './App.css'

function App() {
  const [count, setCount] = useState(32)

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count - 1)}>
          Remaining energypoints: {count}
        </button>

      </div>
      <div>
        <img src={myLogo} className="logo" alt="My Logo" />
      </div>
    </>
  )
}

export default App
