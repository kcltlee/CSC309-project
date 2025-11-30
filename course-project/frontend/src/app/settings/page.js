'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from './settings.module.css';
import colors from '../constants/colors';
import EditProfileForm from '../components/EditProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm';
import SwitchInterfaceForm from '../components/SwitchInterfaceForm';

const NAV_ITEMS = [
  { id: 'profile', label: 'Edit profile' },
  { id: 'password', label: 'Change password' },
  { id: 'interface', label: 'Switch interface' }
];

export default function SettingsPage() {
  const router = useRouter();
  const { initializing, user } = useAuth();
  const [active, setActive] = useState('profile');

  useEffect(() => {
      if (!initializing && !user) {
          router.replace('/login');
      }
  }, [initializing])

  return (
    <div className={styles.container} style={{ '--primary': colors.primary }}>
      <div className={styles.card}>
        <div className={styles.split}>
          <aside className={styles.side}>
            <h3 className={styles.sideTitle}>Settings</h3>

            <nav className={styles.nav}>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    styles.navButton,
                    active === item.id ? styles.navButtonActive : ''
                  ].join(' ')}
                  onClick={() => setActive(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className={styles.main}>
            {active === 'profile' && <EditProfileForm />}
            {active === 'password' && <ChangePasswordForm />}
            {active === 'interface' && <SwitchInterfaceForm />} 
          </section>
        </div>
      </div>
    </div>
  );
}