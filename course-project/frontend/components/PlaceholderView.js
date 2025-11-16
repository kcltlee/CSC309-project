import styles from './PlaceholderView.module.css';
import Button from './Button';

export default function PlaceholderView({
  icon,
  heading,
  description,
  showButton = false,
  buttonText = 'Notify Me',
  onButtonClick,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {icon && (
          <div className={styles.iconWrapper}>
            {icon}
          </div>
        )}
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.description}>{description}</p>
        {showButton && (
          <Button onClick={onButtonClick}>
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
