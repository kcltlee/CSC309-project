'use client';

import styles from './TextBox.module.css';

export default function TextBox({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  disabled = false,
  className = '',
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`${styles.textBox} ${className}`}
    />
  );
}
