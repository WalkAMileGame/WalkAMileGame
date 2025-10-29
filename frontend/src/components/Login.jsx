import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { user, login, logout, error: authError } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const isLoggedIn = !!user;
  const userEmailDisplay = user?.email || userEmail;

  const navigate = useNavigate()

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setError &&  setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
      setPassword('');
      setUserEmail(email);
      navigate("/landing");
    } catch (e) {
      setLocalError(e.message || 'Login failed.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLocalError('');
    setError && setError(null);

    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    // Mock registration for now
    try {
      await login(email, password);
      setPassword('');
      setConfirmPassword('');
    } catch (e) {
      setLocalError(e.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    logout();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError('');
    setError && setError(null);
    navigate("/");
  };

  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setLocalError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError && setError(null);
  };

 return (
    <>
      {/* Show login status and email at the top */}
      {/* Mostly for debugging */}
      <div className="login-status" style={{ textAlign: 'center', margin: '12px 0', color: '#fff' }}>
        {isLoggedIn ? `Logged in as ${userEmailDisplay}` : 'Not logged in'}
      </div>
      <div className="login-container">
        {isLoggedIn ? (
          <div className="login-card welcome-card">
            <h1>Welcome!</h1>
            <p>You have successfully logged in as {userEmailDisplay}.</p>
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
                {(error || localError || authError) && <p className="error-message">{localError || error || authError}</p>}
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
                {(error || localError || authError) && <p className="error-message">{localError || error || authError}</p>}
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
