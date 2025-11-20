'use client';

import LoginPage from './login/page';
import UserDashboardPage from './user/page';
import { useAuth } from '../context/AuthContext.jsx';

export default function Root() {
  const { user } = useAuth();
  console.log(user)

  if (user) { // user is logged in
    return <UserDashboardPage />; // can change to whatever home page
  } else {
    return <LoginPage />;
  }
}