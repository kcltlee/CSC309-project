'use client';

import { useEffect } from 'react';
import Symbol from './Symbol';
import colors from '../constants/colors';
import styles from './Notification.module.css';

export default function Notification({ message, isVisible, onClose, type = 'success' }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const iconColor = type === 'success' ? colors.primaryGreen : colors.primaryRed;
  const iconName = type === 'success' ? 'Check Mark' : 'Warning';

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <Symbol name={iconName} size={20} colour={iconColor} />
      <span className={styles.message}>{message}</span>
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close notification"
      >
        <Symbol name="Ex" size={16} colour={colors.black} />
      </button>
    </div>
  );
}

