import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface TextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function TextButton({ label, onPress, disabled = false }: TextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.md },
  pressed: { backgroundColor: colors.overlay },
  disabled: { opacity: 0.4 },
  label: { ...typography.bodyStrong, color: colors.charcoalSoft, textAlign: 'center' },
});
