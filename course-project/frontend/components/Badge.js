import styles from './Badge.module.css';

export default function Badge({
  children,
  variant = 'green',
  className = '',
}) {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
}
