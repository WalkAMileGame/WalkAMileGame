import React, { useState } from 'react';
import '../styles/Login.css';


export default function Login({ onSubmit, onLogout, isLoggedIn, userEmail, error }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({ email, password });
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <>
      <div className="login-container">
        {/* The component uses the `isLoggedIn` prop to decide what to render */}
        {isLoggedIn ? (
          <div className="login-card welcome-card">
            <h1>Welcome!</h1>
            {/* It displays the user's email passed down as a prop */}
            <p>You have successfully logged in as {userEmail}.</p>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        ) : (
          <div className="login-card">
            <h2 className="title">Login</h2>
            <p className="subtitle">Welcome back! Please enter your details.</p>
            <p className="subtitle">IMPORTANT: Do not input actual login credentials at the moment</p>

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
              <div className="form-group">
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
