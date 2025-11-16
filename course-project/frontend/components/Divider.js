import styles from './Divider.module.css';
import colors from '../constants/colors';

export default function Divider({
  orientation = 'horizontal',
  colour = colors.lightGray,
}) {
  const dividerStyle = {
    backgroundColor: colour,
  };

  return (
    <div
      className={`${styles.divider} ${orientation === 'vertical' ? styles.vertical : styles.horizontal}`}
      style={dividerStyle}
    />
  );
}
