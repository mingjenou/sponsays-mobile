import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ExperienceArtwork } from '@/src/components/cards/ExperienceArtwork';
import { FeedbackPanel } from '@/src/components/feedback/FeedbackPanel';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { findMockPlace } from '@/src/mocks/places';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { formatDuration } from '@/src/utils/formatDuration';

export default function RecommendationActionScreen() {
  const { id, reason } = useLocalSearchParams<{ id: string; reason?: string }>();
  const place = findMockPlace(id);
  const [feedback, setFeedback] = useState<'positive' | 'negative'>();
  const [saved, setSaved] = useState(false);

  if (!place) {
    return (
      <ScreenContainer contentStyle={styles.missing}>
        <EmptyState icon="alert-circle-outline" title="That SponSay wandered off." message="Return to Do and ask for another call." />
        <PrimaryButton label="BACK TO DO" onPress={() => router.replace('/(tabs)/do')} />
      </ScreenContainer>
    );
  }

  const openDirections = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    const encodedAddress = encodeURIComponent(`${place.name}, ${place.address}`);
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${encodedAddress}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const price = place.priceLevel === 0 ? 'Free' : '$'.repeat(place.priceLevel ?? 0);
  const explanation =
    reason ?? 'Close enough to go now, within the moment, and different enough to feel worthwhile.';

  return (
    <ScreenContainer contentStyle={styles.page}>
      <View style={styles.hero}>
        <ExperienceArtwork style={styles.artwork} rounded={false} />
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.floatingButton, styles.backButton]}>
          <Ionicons name="chevron-back" size={23} color={colors.charcoal} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
          accessibilityState={{ selected: saved }}
          onPress={() => setSaved((current) => !current)}
          style={[styles.floatingButton, styles.saveButton]}
        >
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={23} color={saved ? colors.coral : colors.charcoal} />
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.commitment}>YOU’RE GOING.</Text>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.subtitle}>{place.address}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}><Text style={styles.tagText}>{place.category}</Text></View>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow icon="time-outline" label="Time" value={formatDuration(place.estimatedDurationMinutes ?? 60)} />
          <DetailRow icon="cash-outline" label="Cost" value={price} border />
          <DetailRow icon="navigate-outline" label="Distance" value={`${place.distanceKm ?? '—'} km`} border />
          <DetailRow icon="pricetag-outline" label="Category" value={place.category} border />
        </View>

        <View style={styles.whyCard}>
          <View style={styles.whyIcon}><Text style={styles.whySpark}>✦</Text></View>
          <View style={styles.whyCopy}>
            <Text style={styles.whyTitle}>Why we picked this</Text>
            <Text style={styles.whyText}>{explanation}</Text>
          </View>
        </View>

        <PrimaryButton
          label="GET DIRECTIONS"
          onPress={() => void openDirections()}
          icon={<Ionicons name="navigate" size={18} color={colors.surface} />}
          accessibilityHint="Open directions in your maps app"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
          accessibilityState={{ selected: saved }}
          onPress={() => setSaved((current) => !current)}
          style={styles.saveTextButton}
        >
          <Text style={styles.saveText}>{saved ? 'Saved for later ✓' : 'Save for Later'}</Text>
        </Pressable>

        <View style={styles.feedbackSection}>
          <FeedbackPanel
            value={feedback}
            onChange={(value) => {
              setFeedback(value);
              void Haptics.selectionAsync().catch(() => undefined);
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function DetailRow({ icon, label, value, border = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; border?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={[styles.detailRow, border && styles.detailBorder]}>
      <Ionicons name={icon} size={21} color={colors.charcoal} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { justifyContent: 'center' },
  page: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  hero: { height: 285, backgroundColor: colors.charcoal },
  artwork: { height: '100%' },
  floatingButton: { position: 'absolute', top: spacing.md, width: 44, height: 44, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  backButton: { left: spacing.md },
  saveButton: { right: spacing.md },
  sheet: { marginTop: -26, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.md },
  commitment: { ...typography.heading2, color: colors.coral, fontWeight: '800', letterSpacing: 0.6 },
  title: { ...typography.heading1, color: colors.charcoal },
  subtitle: { ...typography.body, color: colors.charcoalSoft, marginTop: -8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { borderRadius: radius.pill, backgroundColor: colors.blueSoft, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  tagText: { ...typography.caption, color: colors.blueDark, fontSize: 11 },
  detailsCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginTop: spacing.xs },
  detailRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  detailBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  detailLabel: { ...typography.caption, color: colors.charcoal, width: 65 },
  detailValue: { ...typography.caption, color: colors.charcoalSoft, textAlign: 'right', flex: 1 },
  whyCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.blueSoft },
  whyIcon: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  whySpark: { color: colors.blueDark, fontSize: 18 },
  whyCopy: { flex: 1, gap: spacing.xxs },
  whyTitle: { ...typography.caption, color: colors.blueDark },
  whyText: { ...typography.caption, color: colors.charcoalSoft, fontWeight: '500' },
  saveTextButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...typography.bodyStrong, color: colors.blueDark },
  feedbackSection: { marginTop: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
