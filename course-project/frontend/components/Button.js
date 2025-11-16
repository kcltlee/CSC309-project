'use client';

import styles from './Button.module.css';
import colors from '../constants/colors';

export function PrimaryButton({
  text,
  symbol,
  symbolPosition = 'left',
  backgroundColor = colors.primaryGreen,
  outlineColor = 'none',
  textColor = colors.white,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) {
  const buttonStyle = {
    backgroundColor: outlineColor === 'none' ? backgroundColor : 'transparent',
    border: outlineColor !== 'none' ? `2px solid ${outlineColor}` : 'none',
    color: textColor,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <button
      type={type}
      className={`${styles.button} ${styles.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
    >
      {symbol && symbolPosition === 'left' && symbol}
      {text && <span className={styles.buttonText}>{text}</span>}
      {symbol && symbolPosition === 'right' && symbol}
    </button>
  );
}

export function SecondaryButton({
  text,
  symbol,
  symbolPosition = 'left',
  backgroundColor = 'transparent',
  outlineColor = colors.lightGray,
  textColor = colors.black,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) {
  const buttonStyle = {
    backgroundColor: backgroundColor,
    border: `2px solid ${outlineColor}`,
    color: textColor,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <button
      type={type}
      className={`${styles.button} ${styles.secondary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
    >
      {symbol && symbolPosition === 'left' && symbol}
      {text && <span className={styles.buttonText}>{text}</span>}
      {symbol && symbolPosition === 'right' && symbol}
    </button>
  );
}

// Default export for backwards compatibility
export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) {
  if (variant === 'secondary') {
    return (
      <SecondaryButton
        text={children}
        onClick={onClick}
        disabled={disabled}
        type={type}
        className={className}
      />
    );
  }

  return (
    <PrimaryButton
      text={children}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
    />
  );
}
