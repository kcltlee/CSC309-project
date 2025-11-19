/**
 * Color palette for the Nurtura application
 * These colors should match the CSS variables in globals.css
 */

export const colors = {
  // Primary Colors
  primaryBrown: '#a17c68',
  primaryBrownDark: '#976e57',
  primaryYellow: '#c89e56',
  primaryYellowDark: '#c29343',
  primaryOrange: '#d18544',
  primaryOrangeDark: '#cc782f',
  primaryGreen: '#6DB159',
  primaryGreenDark: '#548164',
  primaryBlue: '#153169',
  primaryBlueDark: '#487ca5',
  primaryPurple: '#9676b3',
  primaryPurpleDark: '#8a66ab',
  primaryPink: '#bb6594',
  primaryPinkDark: '#b35488',
  primaryRed: '#ca665f',
  primaryRedDark: '#c4554d',
  

  // Neutral Colors
  white: '#ffffff',
  lightGray: '#e5e5e5',
  mediumGray: '#bfbfbf',
  black: '#000000',

  // Semantic Colors (aliases)
  background: '#ffffff',
  foreground: '#000000',
  navBackground: '#e5e5e5',
};

// Export individual color groups for convenience
export const primaryColors = {
  brown: colors.primaryBrown,
  brownDark: colors.primaryBrownDark,
  yellow: colors.primaryYellow,
  yellowDark: colors.primaryYellowDark,
  orange: colors.primaryOrange,
  orangeDark: colors.primaryOrangeDark,
  green: colors.primaryGreen,
  greenDark: colors.primaryGreenDark,
  blue: colors.primaryBlue,
  blueDark: colors.primaryBlueDark,
  purple: colors.primaryPurple,
  purpleDark: colors.primaryPurpleDark,
  pink: colors.primaryPink,
  pinkDark: colors.primaryPinkDark,
  red: colors.primaryRed,
  redDark: colors.primaryRedDark,
};

export const neutralColors = {
  white: colors.white,
  lightGray: colors.lightGray,
  mediumGray: colors.mediumGray,
  black: colors.black,
};

export default colors;
