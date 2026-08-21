import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { RecommendationResult } from '@/src/features/recommendations/engine';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { formatDuration } from '@/src/utils/formatDuration';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { TextButton } from '../buttons/TextButton';

interface SponsayCardProps {
  recommendation: RecommendationResult;
  onAccept: () => void;
  onReject: () => void;
  rejectionLabel?: string;
  rejectionDisabled?: boolean;
}

const priceLabel = (priceLevel = 0): string => (priceLevel === 0 ? 'Free' : '$'.repeat(priceLevel));

export function SponsayCard({
  recommendation,
  onAccept,
  onReject,
  rejectionLabel = 'Not this one',
  rejectionDisabled = false,
}: SponsayCardProps) {
  const { place } = recommendation;
  return (
    <View style={styles.card}>
      <View style={styles.artwork}>
        <View style={styles.sun} />
        <View style={styles.path} />
        <View style={styles.artworkCopy}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{place.category}</Text>
          </View>
          <Text style={styles.artworkMark}>A little Adelaide moment.</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidence}>{recommendation.confidenceLabel}</Text>
          <View style={styles.openPill}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Open now</Text>
          </View>
        </View>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.reason}>{recommendation.reason}</Text>

        <View style={styles.metrics}>
          <Metric icon="navigate-outline" label={`${place.distanceKm ?? '—'} km`} />
          <Metric icon="time-outline" label={formatDuration(place.estimatedDurationMinutes)} />
          <Metric icon="wallet-outline" label={priceLabel(place.priceLevel)} />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="I’M IN"
            onPress={onAccept}
            icon={<Ionicons name="arrow-forward" size={19} color={colors.surface} />}
            accessibilityHint="Open the action view for this recommendation"
          />
          <TextButton label={rejectionLabel} onPress={onReject} disabled={rejectionDisabled} />
        </View>
      </View>
    </View>
  );
}

function Metric({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color={colors.charcoalSoft} />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  artwork: { height: 156, backgroundColor: colors.blueSoft, overflow: 'hidden' },
  sun: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.yellow,
    right: 28,
    top: 20,
  },
  path: {
    position: 'absolute',
    width: 260,
    height: 85,
    borderRadius: 120,
    backgroundColor: colors.blue,
    left: -46,
    bottom: -36,
    transform: [{ rotate: '-7deg' }],
  },
  artworkCopy: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  categoryPillText: { ...typography.caption, color: colors.charcoal },
  artworkMark: { ...typography.caption, color: colors.charcoal, maxWidth: 150 },
  content: { padding: spacing.lg, gap: spacing.md },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  confidence: { ...typography.caption, color: colors.blueDark, textTransform: 'uppercase', letterSpacing: 0.7 },
  openPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.positive },
  openText: { ...typography.caption, color: colors.charcoalMuted, fontSize: 12 },
  title: { ...typography.heading2, color: colors.charcoal },
  reason: { ...typography.body, color: colors.charcoalSoft },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDeep,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  metricLabel: { ...typography.caption, color: colors.charcoalSoft },
  actions: { gap: spacing.xs, paddingTop: spacing.xxs },
});
