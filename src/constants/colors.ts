// Brand Colors
export const COLORS = {
  // Primary
  primary: '#319795',
  primaryHover: '#2C7A7B',

  // Text
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',

  // Background
  bgWhite: '#FFFFFF',
  bgGray: '#F7F7F7',
  bgGrayLight: '#F7FAFC',
  bgGrayDark: '#EDF2F7',

  // Border
  borderLight: '#E2E8F0',
  borderMedium: '#CBD5E0',
  borderDark: '#A8A8A8',
  borderGray: '#D0D0D0',
  borderDivider: '#E5E5E5',

  // Status
  success: '#38A169',
  error: '#E53E3E',
  warning: '#DD6B20',
  info: '#3182CE',

  // Semantic
  teal: {
    500: '#319795',
    600: '#2C7A7B',
  },
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    900: '#1A202C',
  },
  blue: {
    500: '#3182CE',
  },
  red: {
    500: '#E53E3E',
  },

  grayButton: 'rgba(160, 174, 192, 0.5)',
} as const;

export type ColorKeys = keyof typeof COLORS;
