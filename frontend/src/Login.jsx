import React, { useState } from 'react';
import './Login.css'; // Import the dedicated CSS file

export default function Login() {
  // State variables to hold the email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handles the form submission
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevents the default form submission behavior

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Add backend functionality here
    console.log('Logging in with:', { email, password });
    setError('');
    setIsLoggedIn(true);
  };

  // Add backend functionality here
  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    console.log('User logged out.');
  };

  return (
    <>
      <div className="login-container">
        {isLoggedIn ? (
          <div className="login-card welcome-card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#2d3748' }}>Welcome!</h1>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>You have successfully logged in as {email}.</p>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        ) : (
          <div className="login-card">
            <h2 className="title">Login</h2>
            <p className="subtitle">Welcome back! Please enter your details.</p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

