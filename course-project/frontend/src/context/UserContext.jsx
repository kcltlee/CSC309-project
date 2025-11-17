"use client";
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext({ profile: null, setProfile: () => {} });
export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  return (
    <UserContext.Provider value={{ profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;
