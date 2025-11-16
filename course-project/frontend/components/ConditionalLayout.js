'use client';

import { usePathname } from 'next/navigation';
import NavigationBar from './NavigationBar';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();

  // Hide navigation on login and register pages
  // Use startsWith to handle both /login and /login/ (with trailingSlash)
  const hideNav = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (hideNav) {
    return <main>{children}</main>;
  }

  return (
    <>
      <NavigationBar />
      <main style={{ paddingTop: '80px' }}>
        {children}
      </main>
    </>
  );
}
