'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Symbol from './Symbol';
import colors from '../constants/colors';
import { clearAuth, getUserData } from '../utility/auth';
import { useFetchAuthenticated } from '../utility/useFetch';
import styles from './NavigationBar.module.css';

export default function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showStreakValue, setShowStreakValue] = useState(false);
  const [showCoinValue, setShowCoinValue] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [userData, setUserData] = useState(null);
  const [tasksDueToday, setTasksDueToday] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch tasks data
  const { data: tasksData } = useFetchAuthenticated('/api/tasks');

  // Fetch tamagotchi data for coins
  const { data: tamagotchiData, refetch: refetchTamagotchi } = useFetchAuthenticated('/api/tamagotchi');

  const navItems = [
    { label: 'My Tamagotchi', path: '/dashboard' },
    { label: 'Store', path: '/store' },
    { label: 'Friends', path: '/friends' },
  ];

  // Helper to normalize paths for comparison (handle trailing slashes)
  const normalizePath = (path) => path.endsWith('/') ? path.slice(0, -1) : path;

  const isActive = (path) => normalizePath(pathname) === normalizePath(path);

  // Check if current page is in the main nav
  const isMainNavPage = navItems.some(item => normalizePath(item.path) === normalizePath(pathname));

  // Load user data on mount
  useEffect(() => {
    const user = getUserData();
    setUserData(user);
  }, []);

  // Calculate tasks due today
  useEffect(() => {
    if (tasksData && tasksData.success && tasksData.data) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dueToday = tasksData.data.filter(task => {
        // Include tasks that are not completed and due today
        if (task.status !== 'completed' && task.due_date) {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() >= today.getTime() && dueDate.getTime() < tomorrow.getTime();
        }
        return false;
      });

      setTasksDueToday(dueToday.length);
    }
  }, [tasksData]);

  // Update current coins from tamagotchi data
  useEffect(() => {
    if (tamagotchiData && tamagotchiData.success && tamagotchiData.data) {
      setCurrentCoins(tamagotchiData.data.current_coins || 0);
    }
  }, [tamagotchiData]);

  // Listen for coin updates from other components (e.g., store purchases)
  useEffect(() => {
    const handleCoinsUpdated = () => {
      refetchTamagotchi();
    };

    window.addEventListener('coinsUpdated', handleCoinsUpdated);

    return () => {
      window.removeEventListener('coinsUpdated', handleCoinsUpdated);
    };
  }, [refetchTamagotchi]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const updateIndicator = () => {
      if (navRef.current && isMainNavPage) {
        const activeLink = navRef.current.querySelector(`.${styles.active}`);
        if (activeLink) {
          const { offsetLeft, offsetWidth } = activeLink;
          setIndicatorStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
            opacity: 1,
          });
        }
      } else {
        // Hide indicator when not on a main nav page
        setIndicatorStyle({
          opacity: 0,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [pathname, isMainNavPage]);

  return (
    <nav className={styles.navWrapper}>
      <div className={styles.navContainer}>
        {/* Main navigation pill */}
        <div className={styles.navPill} ref={navRef}>
          {/* Sliding white background indicator */}
          <div className={styles.activeIndicator} style={indicatorStyle} />

          {/* Navigation Tabs */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navTab} ${
                isActive(item.path) ? styles.active : ''
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Divider */}
          <div className={styles.divider} />

          {/* Status Indicators */}
          <button
            className={styles.indicator}
            onClick={() => setShowStreakValue(!showStreakValue)}
            aria-label="Tasks due today"
          >
            <Symbol
              name="Task"
              size={20}
              colour={colors.black}
            />
            <span className={showStreakValue ? styles.showOnMobile : ''}>
              {tasksDueToday} Today
            </span>
          </button>

          <button
            className={styles.indicator}
            onClick={() => setShowCoinValue(!showCoinValue)}
            aria-label="Current coins"
          >
            <Symbol
              name="Coin"
              size={20}
              colour={colors.black}
            />
            <span className={showCoinValue ? styles.showOnMobile : ''}>
              {currentCoins} Coins
            </span>
          </button>
        </div>

        {/* User Menu - outside the pill */}
        <div className={styles.userMenuWrapper} ref={dropdownRef}>
          <button
            className={styles.userMenuButton}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User menu"
          >
            <Symbol
              name="Cog"
              size={24}
              colour={colors.black}
            />
          </button>

          {isUserMenuOpen && (
            <div className={styles.dropdown}>
              {userData && (
                <div className={styles.userInfo}>
                  <div className={styles.username}>{userData.username}</div>
                  <div className={styles.userEmail}>{userData.email}</div>
                </div>
              )}
              <Link
                href="/settings"
                className={styles.dropdownItem}
                onClick={() => setIsUserMenuOpen(false)}
              >
                <span className={styles.dropdownIcon}>⚙️</span>
                Settings
              </Link>
              <button
                className={`${styles.dropdownItem} ${styles.logoutButton}`}
                onClick={() => {
                  clearAuth();
                  setIsUserMenuOpen(false);
                  router.push('/login');
                }}
              >
                <span className={styles.dropdownIcon}>🚪</span>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
