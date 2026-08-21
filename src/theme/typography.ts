import type { TextStyle } from 'react-native';

type TypeScale = Record<
  'display' | 'heading1' | 'heading2' | 'body' | 'bodyStrong' | 'caption' | 'button',
  TextStyle
>;

export const typography: TypeScale = {
  display: { fontSize: 38, lineHeight: 43, fontWeight: '800', letterSpacing: -1.2 },
  heading1: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7 },
  heading2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '800', letterSpacing: 0.5 },
};
