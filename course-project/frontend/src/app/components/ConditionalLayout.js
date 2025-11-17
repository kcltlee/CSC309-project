'use client';

import { usePathname } from 'next/navigation';
import NavigationBar from './NavigationBar';

export default function ConditionalLayout({ children, show }) {
  const pathname = usePathname();

  // Hide navigation on login and register pages
  // Use startsWith to handle both /login and /login/ (with trailingSlash)
  const hideNav = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (!show || hideNav) return null;

  return (
    <>
      <NavigationBar />
      <main style={{ paddingTop: '80px' }}>
        {children}
      </main>
    </>
  );
}
