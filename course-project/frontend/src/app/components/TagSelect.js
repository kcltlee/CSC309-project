'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './TagSelect.module.css';
import colors from '../constants/colors';

/**
 * TagSelect Component
 *
 * A button that opens a dropdown menu with selectable tag options
 *
 * @param {Object[]} options - Array of option objects
 * @param {string} options[].text - Display text for the option
 * @param {React.ReactNode} [options[].symbol] - Optional symbol/icon component
 * @param {Function} options[].action - Callback function when option is selected
 * @param {string} [options[].backgroundColour] - Background color for this option (overrides default)
 * @param {string} [options[].outlineColour] - Outline color for this option (overrides default)
 * @param {string} [options[].textColour] - Text color for this option (overrides default)
 * @param {string} backgroundColour - Background color for the tag (hex code)
 * @param {string} [outlineColour] - Outline/border color (defaults to darker version of background)
 * @param {string} [textColour='#ffffff'] - Text color (defaults to white)
 * @param {string} [type='capsule'] - Style type: 'capsule' or 'rounded'
 * @param {string} [defaultText='Select'] - Default text to display before selection
 * @param {React.ReactNode} [defaultSymbol] - Optional default symbol to display
 */
export default function TagSelect({
  options = [],
  backgroundColour = colors.primaryGreen,
  outlineColour = null,
  textColour = colors.white,
  type = 'capsule',
  defaultText = 'Select',
  defaultSymbol = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleButtonClick = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (option.action) {
      option.action();
    }
  };

  const displayText = selectedOption?.text || defaultText;
  const displaySymbol = selectedOption?.symbol || defaultSymbol;
  const displayBackgroundColour = selectedOption?.backgroundColour || backgroundColour;
  const displayOutlineColour = selectedOption?.outlineColour || outlineColour;
  const displayTextColour = selectedOption?.textColour || textColour;

  // Darken a color by a percentage
  const darkenColor = (hexColor, percent = 15) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    // Darken each component
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    // Convert back to hex
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const outline = displayOutlineColour || darkenColor(displayBackgroundColour);
  const buttonClass = type === 'capsule' ? styles.tagButtonCapsule : styles.tagButtonRounded;

  return (
    <div className={styles.container}>
      <button
        ref={buttonRef}
        className={`${styles.tagButton} ${buttonClass}`}
        onClick={handleButtonClick}
        style={{
          backgroundColor: displayBackgroundColour,
          borderColor: outline,
          color: displayTextColour,
        }}
      >
        {displaySymbol && (
          <span className={styles.symbol}>{displaySymbol}</span>
        )}
        {displayText && (
          <span className={styles.text}>{displayText}</span>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.menu}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          {options.map((option, index) => {
            const optionBg = option.backgroundColour || backgroundColour;
            const optionOutline = option.outlineColour || darkenColor(optionBg);
            const optionText = option.textColour || textColour;

            return (
              <button
                key={index}
                className={`${styles.menuOption} ${buttonClass}`}
                onClick={() => handleOptionClick(option)}
                style={{
                  backgroundColor: optionBg,
                  borderColor: optionOutline,
                  color: optionText,
                }}
              >
                {option.symbol && (
                  <span className={styles.optionSymbol}>{option.symbol}</span>
                )}
                {option.text && (
                  <span className={styles.optionText}>{option.text}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
