import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { API_BASE } from '../api';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // { email, ... }
  const [token, setToken] = useState(null);      // JWT or opaque token
  const [loading, setLoading] = useState(true);  // initial restore state
  const [error, setError] = useState(null);
  
  const hasRestored = useRef(false);

  
  // Restore session on app load
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const stored = localStorage.getItem('wam_auth');
    let initialToken = null;

    if (stored) {
      try {
        initialToken = JSON.parse(stored).token;
      } catch (e) {
        localStorage.removeItem('wam_auth');
      }
    }

    if (initialToken) {
      // We have a token. Set it in state.
      setToken(initialToken);
      
      fetch(`${API_BASE}/users/me`, {
        headers: {
          "Authorization": `Bearer ${initialToken}`
        }
      })
      .then(res => {
        if (!res.ok) {
          // Token was invalid or expired
          throw new Error("Session expired");
        }
        return res.json();
      })
      .then(userData => {
        // Success!
        setUser(userData);
      })
      .catch(err => {
        // Token was bad. Clear everything.
        setUser(null);
        setToken(null);
        localStorage.removeItem('wam_auth');
      })
      .finally(() => {
        setLoading(false);
      });

    } else {
      // No token found, just stop loading
      setLoading(false);
    }
  }, []);

  // persist changes
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('wam_auth', JSON.stringify({ user, token }));
    } else {
      localStorage.removeItem('wam_auth');
    }
  }, [user, token]);

  const login = async (email, password) => {
    setError(null);

    try {
        const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });
      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Login failed";
        throw new Error(message);
      }

      const data = await res.json();

      setToken(data.access_token);
      setUser(data.user);
      return data;

    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}