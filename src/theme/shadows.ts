import type { ViewStyle } from 'react-native';

export const shadows: Record<'card' | 'button', ViewStyle> = {
  card: {
    shadowColor: '#1F1F23',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  button: {
    shadowColor: '#FF6B57',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },
};
