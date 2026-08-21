import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface ContextChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: 'turquoise' | 'yellow';
}

export function ContextChip({ label, selected, onPress, accent = 'turquoise' }: ContextChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && (accent === 'yellow' ? styles.selectedYellow : styles.selectedTurquoise),
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedTurquoise: { borderColor: colors.turquoise, backgroundColor: colors.turquoiseSoft },
  selectedYellow: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  pressed: { transform: [{ scale: 0.97 }] },
  label: { ...typography.caption, color: colors.charcoalSoft },
  selectedLabel: { color: colors.charcoal, fontWeight: '800' },
});
