'use client';

import { primaryColors } from '../constants/colors';
import Symbol from './Symbol';
import styles from './ColorPicker.module.css';

export default function ColorPicker({
  selectedColor,
  onChange,
  className = '',
}) {
  // Get array of color values from primaryColors with both normal and dark variants
  const colorOptions = [
    { name: 'Brown', value: primaryColors.brown, dark: primaryColors.brownDark },
    { name: 'Yellow', value: primaryColors.yellow, dark: primaryColors.yellowDark },
    { name: 'Orange', value: primaryColors.orange, dark: primaryColors.orangeDark },
    { name: 'Green', value: primaryColors.green, dark: primaryColors.greenDark },
    { name: 'Blue', value: primaryColors.blue, dark: primaryColors.blueDark },
    { name: 'Purple', value: primaryColors.purple, dark: primaryColors.purpleDark },
    { name: 'Pink', value: primaryColors.pink, dark: primaryColors.pinkDark },
    { name: 'Red', value: primaryColors.red, dark: primaryColors.redDark },
  ];

  return (
    <div className={`${styles.container} ${className}`}>
      {colorOptions.map((color) => {
        const isSelected = selectedColor === color.value;
        return (
          <button
            key={color.value}
            type="button"
            className={`${styles.colorButton} ${isSelected ? styles.selected : ''}`}
            style={{
              backgroundColor: color.value,
              borderColor: isSelected ? color.dark : 'transparent'
            }}
            onClick={() => onChange(color.value)}
            aria-label={`Select ${color.name}`}
            title={color.name}
          >
            {isSelected && (
              <div className={styles.checkmark}>
                <Symbol name="Check Mark" size={20} colour="#ffffff" />
              </div>
            )}
          </button>
        );
      })}
      <input type="color" />
    </div>
  );
}
