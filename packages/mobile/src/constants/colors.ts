/**
 * Color palette for the mobile app
 */
export const colors = {
  // Primary colors
  primary: '#7B68BE', // Medium purple with good contrast
  primaryLight: '#9C88D4',
  primaryDark: '#5E4D9E',

  // Secondary colors
  secondary: '#03DAC6',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E0E0E0',
  gray300: '#BDBDBD',
  gray400: '#9E9E9E',
  gray500: '#757575',
  gray600: '#666666',
  gray700: '#424242',
  gray800: '#333333',
  gray900: '#212121',

  // Text colors
  textPrimary: '#212121',
  textSecondary: '#666666',
  textDisabled: '#999999',

  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',

  // Others
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorName = keyof typeof colors;
