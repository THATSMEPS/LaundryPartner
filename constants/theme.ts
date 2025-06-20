export const theme = {
  colors: {
    primary: '#00796B', // Teal Dream
    secondary: '#FFCD2D', // Sunrise Gold
    background: '#F8F8F8', // Background White
    surface: '#ECEFF1', // Content Gray
    textPrimary: '#424242', // Text Gray Dark
    textSecondary: '#757575', // Text Gray Light
    success: '#00796B', // Fresh Mint
    warning: '#FFB300', // Soft Amber
    error: '#E57373', // Deep Rose
    white: '#FFFFFF',
    black: '#000000',
    border: '#E0E0E0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '600' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '500' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;