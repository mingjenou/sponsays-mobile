import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, radius, spacing, typography } from '@/src/theme';

const AREA_SIGNALS = [
  { icon: 'cafe-outline' as const, label: 'Coffee', count: 'Plenty nearby', color: colors.yellowSoft },
  { icon: 'leaf-outline' as const, label: 'Outdoors', count: 'A few good calls', color: colors.turquoiseSoft },
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

      <View style={styles.mapCard} accessibilityLabel="Illustrated map of central Adelaide demo area">
        <View style={styles.roadHorizontal} />
        <View style={styles.roadVertical} />
        <View style={styles.park} />
        <MapPin style={styles.pinOne} color={colors.coral} />
        <MapPin style={styles.pinTwo} color={colors.turquoise} />
        <MapPin style={styles.pinThree} color={colors.yellow} />
        <View style={styles.youAreHere}>
          <View style={styles.youDot} />
          <Text style={styles.youText}>You’re here</Text>
        </View>
        <View style={styles.radiusRing} />
      </View>

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
            <Ionicons name="checkmark-circle" size={20} color={colors.turquoise} />
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

function MapPin({ color, style }: { color: string; style: object }) {
  return (
    <View style={[styles.mapPin, style, { backgroundColor: color }]}>
      <View style={styles.pinCenter} />
    </View>
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
  roadHorizontal: { position: 'absolute', height: 34, width: '120%', top: 105, left: -20, backgroundColor: colors.surface, transform: [{ rotate: '-8deg' }] },
  roadVertical: { position: 'absolute', width: 30, height: '120%', left: 174, top: -20, backgroundColor: colors.surface, transform: [{ rotate: '10deg' }] },
  park: { position: 'absolute', width: 110, height: 76, borderRadius: radius.lg, backgroundColor: colors.turquoiseSoft, top: 22, right: 16 },
  radiusRing: { position: 'absolute', width: 145, height: 145, borderRadius: 73, borderWidth: 1, borderColor: colors.turquoise, borderStyle: 'dashed', top: 52, left: 82 },
  mapPin: { position: 'absolute', width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
  pinCenter: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.surface },
  pinOne: { top: 48, left: 56 },
  pinTwo: { right: 52, bottom: 50 },
  pinThree: { left: 112, bottom: 33 },
  youAreHere: { position: 'absolute', left: 130, top: 105, alignItems: 'center' },
  youDot: { width: 18, height: 18, borderRadius: radius.pill, backgroundColor: colors.charcoal, borderWidth: 4, borderColor: colors.surface },
  youText: { ...typography.caption, color: colors.charcoal, backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, borderRadius: radius.sm, marginTop: spacing.xxs },
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
