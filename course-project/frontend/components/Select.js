'use client';

import { useState, useRef } from 'react';
import Symbol from './Symbol';
import MenuModal from './MenuModal';
import styles from './Select.module.css';

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  const menuOptions = options.map((option) => ({
    text: option,
    action: () => handleSelect(option),
  }));

  return (
    <div ref={selectRef} className={`${styles.container} ${className}`}>
      <button
        type="button"
        className={`${styles.select} ${isPlaceholder ? styles.placeholder : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={styles.value}>{displayValue}</span>
        <Symbol name="Drop Down" size={16} colour="#000000" />
      </button>

      <MenuModal
        options={menuOptions}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={selectRef}
        position="bottom-left"
      />
    </div>
  );
}
