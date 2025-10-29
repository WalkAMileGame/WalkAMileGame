import React, { useState } from 'react';
import '../styles/Login.css';

export default function Login() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');

  // Handles the form submission for logging in
  const handleLogin = (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Mock Login Logic
    setIsLoggedIn(true);
    setUserEmail(email);
    setPassword('');
  };

  // Handles the form submission for registration
  const handleRegister = (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
        setError('Please fill out all fields.');
        return;
    }
    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }
    // Mock Registration Logic
    setIsLoggedIn(true);
    setUserEmail(email);
    setPassword('');
    setConfirmPassword('');
  };

  // Handles logging the user out
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <>
      <div className="login-container">
        {isLoggedIn ? (
          <div className="login-card welcome-card">
            <h1>Welcome!</h1>
            <p>You have successfully logged in as {userEmail}.</p>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        ) : (
          <div className="login-card">
            {isRegistering ? (
              <>
                <h2 className="title">Register</h2>
                <p className="subtitle">Create an account to get started.</p>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleRegister} noValidate>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                  </div>
                  <button type="submit" className="btn btn-primary">Register</button>
                </form>
                <div className="toggle-form">
                  <span>Already have an account? </span>
                  <button onClick={toggleForm} className="toggle-button">Login</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="title">Login</h2>
                <p className="subtitle">Welcome back! Please enter your details.</p>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleLogin} noValidate>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                  </div>
                  <button type="submit" className="btn btn-primary">Login</button>
                </form>
                <div className="toggle-form">
                  <span>Don't have an account? </span>
                  <button onClick={toggleForm} className="toggle-button">Register</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

