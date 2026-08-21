import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  tone?: 'coral' | 'charcoal';
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  tone = 'coral',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'charcoal' && styles.charcoal,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <View style={styles.content}>
          <Text maxFontSizeMultiplier={1.5} style={styles.label}>{label}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    ...shadows.button,
  },
  charcoal: { backgroundColor: colors.charcoal, shadowColor: colors.charcoal },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  label: { ...typography.button, color: colors.surface },
});
