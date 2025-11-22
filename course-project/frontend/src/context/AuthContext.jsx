"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({ user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  initializing: true,
  currentInterface: null,
  setCurrentInterface: () => {}});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  const interfaces = ["regular", "cashier", "manager", "superuser", "organizer"]
  const [currentInterface, setCurrentInterface] = useState(null);

  useEffect(() => {
    setInitializing(true);
    const token = localStorage.getItem("token");
    
    if (!token) { 
        setUser(null);
        setCurrentInterface(null);
        setInitializing(false);
    } else {
        setToken(token);

        fetch('/users/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((data) => data.json())
        .then((data) => {
            setUser(data);
            setCurrentInterface(currentInterface || data.role);
        })
        .finally(() => setInitializing(false));
    }
  }, [])

  const login = async (utorid, password) => {
    const res = await fetch('/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utorid, password })
    })

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Login failed');
    }

    setToken(data.token);
    localStorage.setItem('token', data.token);

    fetch('/users/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${data.token}` }
    })
    .then((data) => data.json())
    .then(userData => {
      setUser(userData);
      setCurrentInterface(currentInterface || userData.role);
    });

    router.push("/user"); // TODO: change to home page
  };

  const loadUser = () => {
     fetch('/users/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then((data) => data.json())
    .then(data => {
       setUser(data);
       setCurrentInterface(currentInterface || data.role);
    });
  }

  const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("interface");
      setToken(null);
      setUser(null);

      router.push("/");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loadUser,
      token,
      login,
      logout,
      initializing,
      currentInterface,
      setCurrentInterface
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
