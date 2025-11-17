'use client';

import { usePathname } from 'next/navigation';
import NavigationBar from './NavigationBar';

export default function ConditionalNav({ items }) {
  const pathname = usePathname();

  // Hide navigation on login and register pages
  const hideNav = pathname === '/login' || pathname === '/register' || pathname === '/';

  if (hideNav) {
    return null;
  }

  return (
    <>
      <NavigationBar />
      <nav>{JSON.stringify(items)}</nav>
    </>
  );
}
