import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { MapCanvas } from '@/src/components/maps/MapCanvas';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, radius, spacing, typography } from '@/src/theme';

const AREA_SIGNALS = [
  { icon: 'cafe-outline' as const, label: 'Coffee', count: 'Plenty nearby', color: colors.creamDeep },
  { icon: 'leaf-outline' as const, label: 'Outdoors', count: 'A few good calls', color: colors.blueSoft },
  { icon: 'color-palette-outline' as const, label: 'Culture', count: 'Strong right now', color: colors.coralSoft },
];

export default function AroundMeScreen() {
  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.heading}>
        <SectionHeader
          eyebrow="ADELAIDE CBD · DEMO AREA"
          title="Around you"
          description="A quick read of the area — enough context to make a call, not another map to browse."
        />
      </View>

      <MapCanvas style={styles.mapCard} />

      <View style={styles.signalHeader}>
        <Text style={styles.signalTitle}>THE AREA’S ENERGY</Text>
        <Text style={styles.signalMeta}>within 5 km</Text>
      </View>
      <View style={styles.signalList}>
        {AREA_SIGNALS.map((signal) => (
          <View key={signal.label} style={styles.signalCard}>
            <View style={[styles.signalIcon, { backgroundColor: signal.color }]}>
              <Ionicons name={signal.icon} size={20} color={colors.charcoal} />
            </View>
            <View style={styles.signalCopy}>
              <Text style={styles.signalLabel}>{signal.label}</Text>
              <Text style={styles.signalCount}>{signal.count}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.blueDark} />
          </View>
        ))}
      </View>

      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>Seen enough?</Text>
        <Text style={styles.calloutCopy}>Let SponSays turn the nearby options into one decision.</Text>
        <PrimaryButton label="SPONSAY ME ✦" onPress={() => router.navigate('/(tabs)/do')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: spacing.xxl },
  mapCard: {
    height: 250,
    borderRadius: radius.xl,
    backgroundColor: colors.creamDeep,
    overflow: 'hidden',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  signalTitle: { ...typography.caption, color: colors.charcoal, letterSpacing: 0.9, fontSize: 11 },
  signalMeta: { ...typography.caption, color: colors.charcoalMuted, fontSize: 11 },
  signalList: { gap: spacing.xs, marginTop: spacing.sm },
  signalCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.sm },
  signalIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  signalCopy: { flex: 1 },
  signalLabel: { ...typography.bodyStrong, color: colors.charcoal },
  signalCount: { ...typography.caption, color: colors.charcoalMuted },
  callout: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.charcoal, gap: spacing.sm },
  calloutTitle: { ...typography.heading2, color: colors.surface },
  calloutCopy: { ...typography.body, color: colors.creamDeep, marginBottom: spacing.xs },
});
