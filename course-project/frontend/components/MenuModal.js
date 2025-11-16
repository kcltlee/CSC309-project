'use client';

import { useEffect, useRef, useState } from 'react';
import Divider from './Divider';
import styles from './MenuModal.module.css';

export default function MenuModal({
  options,
  isOpen,
  onClose,
  anchorRef,
  position = 'bottom-left',
}) {
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (!menuRef.current || !anchorRef.current) return;

        const anchorRect = anchorRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        if (position === 'bottom-left') {
          top = anchorRect.bottom + 4;
          left = anchorRect.left;
        } else if (position === 'bottom-right') {
          top = anchorRect.bottom + 4;
          left = anchorRect.right - menuRect.width;
        } else if (position === 'top-left') {
          top = anchorRect.top - menuRect.height - 4;
          left = anchorRect.left;
        } else if (position === 'top-right') {
          top = anchorRect.top - menuRect.height - 4;
          left = anchorRect.right - menuRect.width;
        }

        setMenuPosition({ top, left });
      });
    }
  }, [isOpen, position, anchorRef]);

  if (!isOpen) return null;

  const handleOptionClick = (action) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      {options.map((option, index) => (
        <div key={index}>
          {index > 0 && (
            <div className={styles.dividerWrapper}>
              <Divider orientation="horizontal" colour="#D1D5DB" />
            </div>
          )}
          <button
            className={styles.menuOption}
            onClick={() => handleOptionClick(option.action)}
          >
            {option.symbol && <span className={styles.symbol}>{option.symbol}</span>}
            <span className={styles.text}>{option.text}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
