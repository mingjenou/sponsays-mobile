import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface FeedbackPanelProps {
  value?: 'positive' | 'negative';
  onChange: (value: 'positive' | 'negative') => void;
}

export function FeedbackPanel({ value, onChange }: FeedbackPanelProps) {
  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.title}>Good call?</Text>
        <Text style={styles.copy}>Your feedback improves future SponSays.</Text>
      </View>
      <View style={styles.options}>
        <FeedbackButton label="👍 Yes" selected={value === 'positive'} onPress={() => onChange('positive')} />
        <FeedbackButton label="👎 Not really" selected={value === 'negative'} onPress={() => onChange('negative')} />
      </View>
      {value ? <Text style={styles.thanks}>Got it — thanks.</Text> : null}
    </View>
  );
}

function FeedbackButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.selectedOption]}
    >
      <Text style={[styles.optionText, selected && styles.selectedOptionText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  title: { ...typography.heading2, color: colors.charcoal },
  copy: { ...typography.caption, color: colors.charcoalMuted, marginTop: spacing.xxs },
  options: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  selectedOption: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  optionText: { ...typography.caption, color: colors.charcoalSoft },
  selectedOptionText: { color: colors.charcoal },
  thanks: { ...typography.caption, color: colors.positive },
});
