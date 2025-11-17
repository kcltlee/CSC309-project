'use client';

import { useState, useRef } from 'react';
import MenuModal from './MenuModal';
import styles from './DropDownButton.module.css';

export default function DropDownButton({
  symbol,
  options,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`${styles.dropDownButton} ${className}`}
        onClick={handleClick}
      >
        {symbol}
      </button>
      <MenuModal
        options={options}
        isOpen={isOpen}
        onClose={handleClose}
        anchorRef={buttonRef}
        position="bottom-right"
      />
    </>
  );
}
