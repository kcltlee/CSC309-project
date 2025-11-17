'use client';

import styles from './TextField.module.css';

export default function TextField({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  isError = false,
  errorMessage = '',
  className = '',
}) {
  return (
    <div className={styles.container}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.textField} ${isError ? styles.error : ''} ${className}`}
      />
      {isError && errorMessage && (
        <p className={styles.errorMessage}>{errorMessage}</p>
      )}
    </div>
  );
}
