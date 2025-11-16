'use client';

import { useState, useRef } from 'react';
import MenuModal from './MenuModal';
import Divider from './Divider';
import styles from './PrimaryActionDropDownButton.module.css';

export default function PrimaryActionDropDownButton({
  options,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  if (!options || options.length === 0) {
    return null;
  }

  const primaryOption = options[0];
  const dropdownOptions = options.slice(1);

  const handlePrimaryClick = () => {
    primaryOption.action();
  };

  const handleDropdownClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div ref={buttonRef} className={`${styles.container} ${className}`}>
        <button
          className={styles.primaryButton}
          onClick={handlePrimaryClick}
        >
          {primaryOption.symbol && (
            <span className={styles.symbol}>{primaryOption.symbol}</span>
          )}
          <span className={styles.text}>{primaryOption.text}</span>
        </button>

        {dropdownOptions.length > 0 && (
          <>
            <div className={styles.dividerWrapper}>
              <Divider orientation="vertical" colour="#D1D5DB" />
            </div>
            <button
              className={styles.dropdownButton}
              onClick={handleDropdownClick}
            >
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {dropdownOptions.length > 0 && (
        <MenuModal
          options={dropdownOptions}
          isOpen={isOpen}
          onClose={handleClose}
          anchorRef={buttonRef}
          position="bottom-right"
        />
      )}
    </>
  );
}
