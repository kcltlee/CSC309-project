'use client';

import { useState } from 'react';
import EditProfileForm from './EditProfileForm';
import ChangePasswordForm from './ChangePasswordForm';
import SwitchInterfaceForm from './SwitchInterfaceForm';
import styles from '../settings/settings.module.css';
import colors from '../constants/colors';

const NAV_ITEMS = [
  { id: 'profile', label: 'Edit profile' },
  { id: 'password', label: 'Change password' },
  { id: 'interface', label: 'Switch interface' }
];

export default function SettingsPanel() {
  const [active, setActive] = useState('profile');

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