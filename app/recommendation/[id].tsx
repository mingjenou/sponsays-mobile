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

export default function RecommendationActionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    const encodedAddress = encodeURIComponent(`${place.name}, ${place.address}`);
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${encodedAddress}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const price = place.priceLevel === 0 ? 'Free' : '$'.repeat(place.priceLevel ?? 0);
  const tags = [place.category, ...place.tags]
    .filter((tag, index, allTags) => allTags.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index)
    .slice(0, 3);

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
        <View style={styles.dots}><View style={styles.dotActive} /><View style={styles.dot} /><View style={styles.dot} /></View>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.subtitle}>A nearby experience picked for the moment.</Text>
        <View style={styles.tags}>
          {tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}
        </View>

        <View style={styles.detailsCard}>
          <DetailRow icon="time-outline" label="Time" value="Today · 6:00 PM" />
          <DetailRow icon="cash-outline" label="Budget" value={`${price} estimated`} border />
          <DetailRow icon="location-outline" label="Distance" value={`${place.distanceKm} km · nearby`} border />
          <DetailRow icon="people-outline" label="Crowd" value="Lively  ▮▮▯" border />
        </View>

        <View style={styles.whyCard}>
          <View style={styles.whyIcon}><Text style={styles.whySpark}>✦</Text></View>
          <View style={styles.whyCopy}>
            <Text style={styles.whyTitle}>Why we picked this</Text>
            <Text style={styles.whyText}>Strong local rating, a good fit for right now, and close enough to stop thinking and go.</Text>
          </View>
        </View>

        <PrimaryButton
          label="I'M IN"
          onPress={() => void openDirections()}
          icon={<Ionicons name="navigate" size={18} color={colors.surface} />}
          accessibilityHint="Open directions in your maps app"
        />
        <Pressable accessibilityRole="button" onPress={() => setSaved((current) => !current)} style={styles.saveTextButton}>
          <Text style={styles.saveText}>{saved ? 'Saved for later ✓' : 'Save for Later'}</Text>
        </Pressable>

        <FeedbackPanel
          value={feedback}
          onChange={(value) => {
            setFeedback(value);
            void Haptics.selectionAsync().catch(() => undefined);
          }}
        />
      </View>
    </ScreenContainer>
  );
}

function DetailRow({ icon, label, value, border = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; border?: boolean }) {
  return (
    <View style={[styles.detailRow, border && styles.detailBorder]}>
      <Ionicons name={icon} size={21} color={colors.charcoal} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.charcoalMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { justifyContent: 'center' },
  page: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  hero: { height: 310, backgroundColor: colors.charcoal },
  artwork: { height: '100%' },
  floatingButton: { position: 'absolute', top: spacing.md, width: 44, height: 44, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  backButton: { left: spacing.md },
  saveButton: { right: spacing.md },
  dots: { position: 'absolute', bottom: 37, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.surface },
  sheet: { marginTop: -26, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.md },
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
  saveTextButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...typography.bodyStrong, color: colors.blueDark },
});
