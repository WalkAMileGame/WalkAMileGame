import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const hasRestored = useRef(false);

  const checkTokenRefresh = (response) => {
    const newToken = response.headers.get('X-Token-Refresh');
    if (newToken) {
      console.log("Silent refresh triggered!");
      setToken(newToken); // This triggers the useEffect below to update localStorage
    }
  };

  // Custom Fetch Wrapper - Replace authentication needing fetches with this
  const authFetch = useCallback(async (endpoint, options = {}) => {
    console.log("asd", endpoint, options)
    const currentToken = token || JSON.parse(localStorage.getItem('wam_auth') || '{}').token;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    // Check header for new token immediately
    checkTokenRefresh(response);

    if (response.status === 401) {
      logout();
      throw new Error("Session expired");
    }

    return response;
  }, [token]);


  // Restore session
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const stored = localStorage.getItem('wam_auth');
    let initialToken = null;

    if (stored) {
      try { initialToken = JSON.parse(stored).token; } 
      catch (e) { localStorage.removeItem('wam_auth'); }
    }

    if (initialToken) {
      setToken(initialToken);
      
      fetch(`${API_BASE}/users/me`, {
        headers: { "Authorization": `Bearer ${initialToken}` }
      })
      .then(res => {
        checkTokenRefresh(res);
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then(userData => setUser(userData))
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('wam_auth');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Persist changes
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
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('wam_auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
