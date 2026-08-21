import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  eyebrow: { ...typography.caption, color: colors.turquoise, textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { ...typography.heading1, color: colors.charcoal },
  description: { ...typography.body, color: colors.charcoalSoft },
});
