"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({ user: null, token: null, login: async () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (t) setToken(t);
  }, []);

  const login = async (email, password) => {
    setToken('demo');
    if (typeof window !== 'undefined') localStorage.setItem('token', 'demo');
    setUser({ email });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
