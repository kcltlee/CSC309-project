'use client';

import { useEffect, useRef } from 'react';
import Symbol from './Symbol';
import colors from '../constants/colors';
import styles from './Popover.module.css';

export default function Popover({
  isOpen,
  onClose,
  children,
  maxWidth = '800px',
  maxHeight = '90vh',
  className = '',
}) {
  const contentRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when popover is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={contentRef}
        className={`${styles.content} ${className}`}
        style={{ maxWidth, maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <Symbol name="Ex" size={24} colour={colors.black} />
        </button>
        <div className={styles.children}>
          {children}
        </div>
      </div>
    </div>
  );
}
