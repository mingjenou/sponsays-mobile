import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ExperienceArtwork } from '@/src/components/cards/ExperienceArtwork';
import { ContextChip } from '@/src/components/chips/ContextChip';
import { ModeSelector } from '@/src/components/chips/ModeSelector';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { MapCanvas, MapSearchBar } from '@/src/components/maps/MapCanvas';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { MAX_REPLACEMENTS_PER_SESSION } from '@/src/constants/recommendations';
import {
  makeRecommendation,
  type RecommendationContext,
  type RecommendationResult,
  type SpontaneityMode,
} from '@/src/features/recommendations/engine';
import { ADELAIDE_PLACES } from '@/src/mocks/places';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';

type DecisionStatus = 'idle' | 'deciding' | 'result' | 'limit' | 'empty';
const CONTEXT_OPTIONS = ['Tonight', '$$', 'Couple', 'Nearby'] as const;

export default function DoScreen() {
  const [mode, setMode] = useState<SpontaneityMode>('spontaneous');
  const [selectedContext, setSelectedContext] = useState<string[]>([...CONTEXT_OPTIONS]);
  const [status, setStatus] = useState<DecisionStatus>('idle');
  const [recommendation, setRecommendation] = useState<RecommendationResult>();
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [replacementCount, setReplacementCount] = useState(0);
  const decisionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (decisionTimer.current) clearTimeout(decisionTimer.current);
    },
    [],
  );

  const toggleContext = (label: string) => {
    setSelectedContext((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const buildContext = (rejections: string[]): RecommendationContext => ({
    interests: ['outdoors', 'culture', 'hidden gems', 'entertainment'],
    socialContext: selectedContext.includes('Couple') ? 'couple' : undefined,
    maximumPriceLevel: selectedContext.includes('$$') ? 2 : undefined,
    maximumDistanceKm: selectedContext.includes('Nearby') ? 5 : 15,
    availableMinutes: 150,
    rejectedPlaceIds: rejections,
  });

  const decide = (rejections = rejectedIds) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setStatus('deciding');
    setRecommendation(undefined);
    if (decisionTimer.current) clearTimeout(decisionTimer.current);
    decisionTimer.current = setTimeout(() => {
      const next = makeRecommendation(ADELAIDE_PLACES, buildContext(rejections), mode);
      setRecommendation(next);
      setStatus(next ? 'result' : 'empty');
      if (next) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }, 1050);
  };

  const rejectRecommendation = () => {
    if (!recommendation) return;
    const nextRejectedIds = [...rejectedIds, recommendation.place.id];
    setRejectedIds(nextRejectedIds);

    if (replacementCount >= MAX_REPLACEMENTS_PER_SESSION) {
      setStatus('limit');
      setRecommendation(undefined);
      return;
    }

    setReplacementCount((count) => count + 1);
    decide(nextRejectedIds);
  };

  const resetSession = () => {
    setStatus('idle');
    setRecommendation(undefined);
    setRejectedIds([]);
    setReplacementCount(0);
  };

  if (status !== 'idle') {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.revealPage}>
        <MapCanvas muted style={styles.revealMap} />
        <View style={styles.revealScrim} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close recommendation" onPress={resetSession} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.charcoal} />
        </Pressable>

        {status === 'deciding' ? (
          <View style={styles.deciding} accessibilityLiveRegion="polite">
            <DecisionMark loading />
            <Text style={styles.decidingTitle}>SponSays is choosing</Text>
            <Text style={styles.decidingAccent}>one for you!</Text>
            <Text style={styles.decidingCopy}>A great pick nearby.</Text>
          </View>
        ) : status === 'result' && recommendation ? (
          <View style={styles.resultContent}>
            <DecisionMark />
            <Text style={styles.resultLead}>SponSays chose</Text>
            <Text style={styles.resultAccent}>one for you!</Text>
            <Text style={styles.resultSubtitle}>A great pick nearby.</Text>
            <RevealCard
              recommendation={recommendation}
              onView={() => router.push({ pathname: '/recommendation/[id]', params: { id: recommendation.place.id } })}
            />
            <Pressable accessibilityRole="button" onPress={rejectRecommendation} style={styles.anotherButton}>
              <Text style={styles.anotherText}>
                {replacementCount >= MAX_REPLACEMENTS_PER_SESSION ? 'One last rethink' : 'Show me another'}
              </Text>
            </Pressable>
            <Text style={styles.replacementText}>{replacementCount} of {MAX_REPLACEMENTS_PER_SESSION} replacements used</Text>
          </View>
        ) : (
          <View style={styles.messageCard}>
            <DecisionMark />
            <Text style={styles.messageTitle}>
              {status === 'limit' ? 'Let’s change the vibe.' : 'Nothing fits all of that.'}
            </Text>
            <Text style={styles.messageCopy}>
              {status === 'limit'
                ? 'Three rerolls is enough browsing. Change one thing and SponSays will make a better call.'
                : 'Relax one context choice and SponSays will try again.'}
            </Text>
            <PrimaryButton label="ADJUST CONTEXT" onPress={resetSession} />
          </View>
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} contentStyle={styles.page}>
      <View style={styles.header}>
        <View style={styles.avatar}><Ionicons name="person" size={21} color={colors.charcoal} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>SPONTANEOUS PLANS</Text>
          <Text style={styles.headerTitle}>Explore Nearby</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Decision settings" style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={colors.charcoal} />
        </Pressable>
      </View>
      <MapSearchBar />

      <MapCanvas style={styles.homeMap}>
        <View style={styles.decisionDock}>
          <View style={styles.dockTopRow}>
            <BrandMark compact />
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>ADELAIDE · DEMO</Text></View>
          </View>
          <Text style={styles.dockTitle}>What feels good right now?</Text>
          <View style={styles.contextRow}>
            {CONTEXT_OPTIONS.map((label) => (
              <ContextChip
                key={label}
                label={label}
                selected={selectedContext.includes(label)}
                onPress={() => toggleContext(label)}
              />
            ))}
          </View>
          <ModeSelector value={mode} onChange={setMode} />
          <PrimaryButton label="SPONSAY ME ✦" onPress={() => decide()} />
        </View>
      </MapCanvas>
    </ScreenContainer>
  );
}

function DecisionMark({ loading = false }: { loading?: boolean }) {
  return (
    <View style={styles.decisionMark}>
      <View style={styles.markTail} />
      <Text style={styles.markSpark}>✦</Text>
      {loading ? <ActivityIndicator color={colors.surface} style={styles.markLoader} /> : null}
      <View style={styles.confettiOne} />
      <View style={styles.confettiTwo} />
      <View style={styles.confettiThree} />
    </View>
  );
}

function RevealCard({ recommendation, onView }: { recommendation: RecommendationResult; onView: () => void }) {
  const { place } = recommendation;
  return (
    <View style={styles.revealCard}>
      <View>
        <ExperienceArtwork style={styles.cardArtwork} />
        <View style={styles.matchPill}><Text style={styles.matchText}>{Math.round(recommendation.score * 100)}% match</Text></View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        <Text style={styles.cardSubtitle}>{recommendation.reason}</Text>
        <Text style={styles.cardMeta}>{place.category} · {place.distanceKm} km away</Text>
        <PrimaryButton label="VIEW EXPERIENCE" onPress={onView} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.grayLight, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerEyebrow: { ...typography.caption, color: colors.blueDark, fontSize: 9, letterSpacing: 1.1 },
  headerTitle: { ...typography.heading2, color: colors.charcoal, fontSize: 20 },
  filterButton: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  homeMap: { flex: 1, minHeight: 520, marginTop: -4 },
  decisionDock: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm, ...shadows.card },
  dockTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.positive },
  liveText: { ...typography.caption, color: colors.charcoalMuted, fontSize: 9, letterSpacing: 0.6 },
  dockTitle: { ...typography.bodyStrong, color: colors.charcoal },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  revealPage: { padding: 0 },
  revealMap: { ...StyleSheet.absoluteFillObject, borderRadius: 0 },
  revealScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,252,247,0.74)' },
  closeButton: { position: 'absolute', top: spacing.md, left: spacing.md, width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...shadows.card },
  deciding: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  decidingTitle: { ...typography.heading2, color: colors.charcoal, marginTop: spacing.xl },
  decidingAccent: { ...typography.heading2, color: colors.blueDark },
  decidingCopy: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.xs },
  decisionMark: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  markTail: { position: 'absolute', bottom: -9, width: 26, height: 26, borderRadius: 4, backgroundColor: colors.blue, transform: [{ rotate: '45deg' }] },
  markSpark: { color: colors.surface, fontSize: 34, zIndex: 2 },
  markLoader: { position: 'absolute', bottom: -42 },
  confettiOne: { position: 'absolute', width: 5, height: 15, borderRadius: 3, backgroundColor: colors.coral, top: -25, left: 5, transform: [{ rotate: '35deg' }] },
  confettiTwo: { position: 'absolute', width: 5, height: 15, borderRadius: 3, backgroundColor: colors.blueDark, top: -30, right: 8, transform: [{ rotate: '-25deg' }] },
  confettiThree: { position: 'absolute', width: 5, height: 13, borderRadius: 3, backgroundColor: colors.coral, right: -24, top: 8, transform: [{ rotate: '42deg' }] },
  resultContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  resultLead: { ...typography.heading2, color: colors.charcoal, marginTop: spacing.md },
  resultAccent: { ...typography.heading2, color: colors.blueDark },
  resultSubtitle: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.xxs, marginBottom: spacing.md },
  revealCard: { width: '100%', maxWidth: 350, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.sm, ...shadows.card },
  cardArtwork: { height: 145 },
  matchPill: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.coral, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  matchText: { ...typography.caption, color: colors.surface },
  cardContent: { padding: spacing.sm, gap: spacing.xs },
  cardTitle: { ...typography.heading2, color: colors.charcoal, fontSize: 20 },
  cardSubtitle: { ...typography.caption, color: colors.charcoalSoft },
  cardMeta: { ...typography.caption, color: colors.charcoalMuted, marginBottom: spacing.xs },
  anotherButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, marginTop: spacing.xs },
  anotherText: { ...typography.bodyStrong, color: colors.blueDark },
  replacementText: { ...typography.caption, color: colors.charcoalMuted, fontSize: 10 },
  messageCard: { margin: 'auto', width: '84%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.card },
  messageTitle: { ...typography.heading2, color: colors.charcoal, textAlign: 'center' },
  messageCopy: { ...typography.body, color: colors.charcoalSoft, textAlign: 'center' },
});
