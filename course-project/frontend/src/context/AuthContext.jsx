"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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
        setToken(1);
        fetch(`${BACKEND_URL}/users/me`, {
            method: 'GET',
            // headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) throw new Error('Not logged in');
            return res.json();
        })
        .then(data => {
            setUser(data);
            setCurrentInterface(data.role);
        })
        .catch(() => {
            setUser(null);
            setCurrentInterface(null);
        })
        .finally(() => setInitializing(false));
    }, []);

  const login = async (utorid, password) => {
    const res = await fetch(`${BACKEND_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utorid, password })
    })

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Login failed');
    }

    setToken(data.token);
    // localStorage.setItem('token', data.token);

    fetch(`${BACKEND_URL}/users/me`, {
      method: 'GET',
      credentials: 'include'
    //   headers: { 'Authorization': `Bearer ${data.token}` }
    })
    .then((data) => data.json())
    .then(userData => {
      setUser(userData);
      setCurrentInterface(userData.role);
    });

    router.push("/user"); // TODO: change to home page
  };

  const loadUser = () => {
     fetch(`${BACKEND_URL}/users/me`, {
      method: 'GET',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      credentials: 'include'
    })
    .then((data) => data.json())
    .then(data => {
       setUser(data);
       setCurrentInterface(data.role);
    });
  }

  const logout = async () => {
    //   localStorage.removeItem("token");
    fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    setCurrentInterface(null);
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
