import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
import { useNavigate } from "react-router-dom";
import { API_BASE } from '../api';

export default function Login() {
  const { user, login, logout, error: authError } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const isLoggedIn = !!user;
  const userEmailDisplay = user?.email || userEmail;

  const navigate = useNavigate();

  const clearForms = () => {
    setLocalError('');
    setError && setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRegistrationCode('');
    // setRegistrationSuccess(false);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setError && setError(null);

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
      const isExpired = e.message?.includes("ACCOUNT_EXPIRED") || e.status === 403;
      
      if (isExpired) {
        setLocalError("Your account has expired. Please enter a new code to reactivate.");
        setIsRenewing(true);
        setIsRegistering(false);
      } else {
        setLocalError(e.message || 'Login failed.');
      }
    }
  };

  const handleRenew = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!registrationCode || !email || !password) {
      setLocalError('Please fill out all fields.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/renew-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            email, 
            password, 
            new_code: registrationCode
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData.detail || "Renewal failed";
        throw new Error(message);
      }

      alert("Account successfully renewed! You can now log in.");
      toggleForm('login'); 

    } catch (err) {
      setLocalError(err.message || 'Renewal failed.'); 
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLocalError('');
    setError && setError(null);

    if (!registrationCode || !email || !password || !confirmPassword) {
      setLocalError('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: registrationCode }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Registration failed";
        throw new Error(message);
      }

      setRegistrationSuccess(true);
      clearForms(); // Use helper to clean up

    } catch (err) {
      setLocalError(err.message || 'Registration failed.'); 
    }
  };

  const handleLogout = () => {
    logout();
    clearForms();
    navigate("/");
  };

  const toggleForm = (targetView) => {
    clearForms();
    
    if (targetView === 'register') {
        setIsRegistering(true);
        setIsRenewing(false);
    } else if (targetView === 'renew') {
        setIsRenewing(true);
        setIsRegistering(false);
    } else {
        setIsRegistering(false);
        setIsRenewing(false);
    }
  };

 return (
    <>
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
              {/* LOGIC: Check Renewing -> Check Registering -> Else Login */}
              {isRenewing ? (
                <>
                  <h2 className="title">Reactivate Account</h2>
                  <p className="subtitle">Enter your credentials and a new code.</p>
                  {(error || localError || authError) && <p className="error-message">{localError || error || authError}</p>}
                  
                  <form onSubmit={handleRenew} noValidate>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="renew-code" className="form-label">New Registration Code</label>
                      <input type="text" id="renew-code" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className="form-input" placeholder="NEW-CODE-HERE" required />
                    </div>
                    <button type="submit" className="btn btn-primary">Reactivate Account</button>
                  </form>
                  
                  <div className="toggle-form">
                    <button onClick={() => toggleForm('login')} className="toggle-button">Back to Login</button>
                  </div>
                </>
              ) : isRegistering ? (
                registrationSuccess ? (
                  <>
                    <h2 className="title">Success!</h2>
                    <p className="subtitle">Your account creation request is successful!</p>
                    <button onClick={() => {toggleForm('login'); setRegistrationSuccess(false)}} className="btn btn-primary" style={{width: '100%'}}>
                      Proceed to Login
                    </button>
                  </>
                ) : (
                  <>
                  <h2 className="title">Register</h2>
                  <p className="subtitle">Create an account to get started.</p>
                  {(error || localError || authError) && <p className="error-message">{localError || error || authError}</p>}
                  <form onSubmit={handleRegister} noValidate>
                    <div className="form-group">
                      <label htmlFor="register-code" className="form-label">Registration code</label>
                      <input type="text" id="register-code" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className="form-input" placeholder="ABCD-EFGH-1234-5678" required />
                    </div>
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
                    <button onClick={() => toggleForm('login')} className="toggle-button">Login</button>
                  </div>
                </>
              )
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
                    <button onClick={() => toggleForm('register')} className="toggle-button">Register</button>
                  </div>
                </>
              )}
          </div>
        )}
      </div>
    </>
  );
}
