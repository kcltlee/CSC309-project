import Image from 'next/image';
import styles from './Symbol.module.css';

export default function Symbol({
  name,
  size = 24,
  colour = '#000000',
}) {
  // Convert hex color to RGB for filter
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(colour);

  // Create a filter that converts white SVG to the target color
  // For white SVGs, we use a simpler brightness-based approach
  const getColorFilter = () => {
    // Normalize color for comparison
    const normalizedColour = colour.toLowerCase();

    // If target is white, no filter needed
    if (normalizedColour === '#ffffff' || normalizedColour === 'white') {
      return 'none';
    }

    // If target is black, just reduce brightness to 0
    if (normalizedColour === '#000000' || normalizedColour === 'black') {
      return 'brightness(0)';
    }

    // For colored SVGs:
    // Use invert to convert white to black, then apply sepia and hue-rotate
    // This method works better for white SVGs than complex HSL calculations

    // Calculate hue angle from RGB for hue-rotate
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
      if (max === r) {
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        hue = ((b - r) / delta + 2) * 60;
      } else {
        hue = ((r - g) / delta + 4) * 60;
      }
    }

    // Calculate relative brightness (luminance)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // For sepia, we need to shift the hue appropriately
    // After invert(1) and sepia(1), we get a brownish color at hue ~38deg
    // We need to rotate from that base to our target hue
    const sepiaBaseHue = 38;
    const hueRotation = hue - sepiaBaseHue;

    // Calculate saturation
    const saturation = max === 0 ? 0 : (delta / max);

    return `invert(1) sepia(1) saturate(${saturation * 500}%) hue-rotate(${hueRotation}deg) brightness(${luminance * 150}%)`;
  };

  const filter = getColorFilter();

  return (
    <div className={styles.symbolWrapper} style={{ width: size, height: size }}>
      <Image
        src={`/${name} Symbol.svg`}
        alt={name}
        width={size}
        height={size}
        style={{
          filter: filter,
        }}
        className={styles.symbol}
      />
    </div>
  );
}
