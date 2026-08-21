import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SpontaneityMode } from '@/src/features/recommendations/engine';
import { colors, radius, spacing, typography } from '@/src/theme';

const MODES: { value: SpontaneityMode; label: string; symbol: string }[] = [
  { value: 'safe', label: 'Safe', symbol: '●' },
  { value: 'spontaneous', label: 'Spontaneous', symbol: '✦' },
  { value: 'chaos', label: 'Chaos', symbol: '↝' },
];

interface ModeSelectorProps {
  value: SpontaneityMode;
  onChange: (mode: SpontaneityMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {MODES.map((mode) => {
        const selected = mode.value === value;
        return (
          <Pressable
            key={mode.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${mode.label} mode`}
            onPress={() => onChange(mode.value)}
            style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}
          >
            <Text style={[styles.symbol, selected && styles.selectedSymbol]}>{mode.symbol}</Text>
            <Text style={[styles.label, selected && styles.selectedLabel]} numberOfLines={1}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.xxs,
    backgroundColor: colors.creamDeep,
    gap: spacing.xxs,
  },
  option: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  selected: { backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  symbol: { color: colors.charcoalMuted, fontSize: 16, fontWeight: '800' },
  selectedSymbol: { color: colors.turquoise },
  label: { ...typography.caption, color: colors.charcoalMuted, fontSize: 12 },
  selectedLabel: { color: colors.charcoal, fontWeight: '800' },
});
