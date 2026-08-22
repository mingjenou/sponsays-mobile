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
import { BrandMark } from '@/src/components/typography/BrandMark';
import { MAX_REPLACEMENTS_PER_SESSION } from '@/src/constants/recommendations';
import { useAuth } from '@/src/features/auth/useAuth';
import {
  makeRecommendation,
  type RecommendationContext,
  type RecommendationResult,
  type SpontaneityMode,
} from '@/src/features/recommendations/engine';
import {
  createRecommendationSession,
  markRecommendationAccepted,
  markRecommendationRejected,
  persistShownRecommendation,
} from '@/src/features/recommendations/persistenceService';
import { ADELAIDE_PLACES } from '@/src/mocks/places';
import { createPersistenceId, logDataError } from '@/src/services/supabase/service';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { formatDuration } from '@/src/utils/formatDuration';

type DecisionStatus = 'idle' | 'deciding' | 'result' | 'limit' | 'empty';

const CONTEXT_OPTIONS = ['Tonight', '2 hrs', '$$', 'Couple', 'Nearby'] as const;

const MODE_COPY: Record<SpontaneityMode, string> = {
  safe: 'Closer to what you know.',
  spontaneous: 'The sweet spot.',
  chaos: 'Push me somewhere different.',
};

const replacementCopy = (count: number): string => {
  if (count === 1) return 'Okay, another one.';
  if (count === 2) return 'One more?';
  if (count === 3) return 'Last switch before we change the vibe.';
  return 'Not feeling it? I can make another call.';
};

const formatPrice = (priceLevel?: number): string =>
  priceLevel === 0 ? 'Free' : '$'.repeat(priceLevel ?? 0) || 'Flexible';

export default function DoScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<SpontaneityMode>('spontaneous');
  const [selectedContext, setSelectedContext] = useState<string[]>([...CONTEXT_OPTIONS]);
  const [status, setStatus] = useState<DecisionStatus>('idle');
  const [recommendation, setRecommendation] = useState<RecommendationResult>();
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [replacementCount, setReplacementCount] = useState(0);
  const decisionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const persistenceSession = useRef<{ id: string; writable: boolean } | null>(null);
  const currentRecommendationId = useRef<string | null>(null);

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
    mood: selectedContext.includes('Tonight') ? 'nightlife' : undefined,
    maximumPriceLevel: selectedContext.includes('$$') ? 2 : undefined,
    maximumDistanceKm: selectedContext.includes('Nearby') ? 5 : 15,
    availableMinutes: selectedContext.includes('2 hrs') ? 120 : 180,
    rejectedPlaceIds: rejections,
  });

  const enqueuePersistence = (operation: () => Promise<unknown>) => {
    persistenceQueue.current = persistenceQueue.current
      .then(async () => {
        await operation();
      })
      .catch((error: unknown) => logDataError('persistence-queue', error));
  };

  const decide = (rejections = rejectedIds, rankPosition = replacementCount + 1) => {
    const recommendationContext = buildContext(rejections);
    let session = persistenceSession.current;

    if (user && !session) {
      session = { id: createPersistenceId(), writable: true };
      persistenceSession.current = session;
      const capturedSession = session;
      enqueuePersistence(async () => {
        const result = await createRecommendationSession({
          id: capturedSession.id,
          mood: recommendationContext.mood ?? null,
          socialContext: recommendationContext.socialContext ?? null,
          budget: recommendationContext.maximumPriceLevel === undefined
            ? null
            : '$'.repeat(recommendationContext.maximumPriceLevel),
          availableMinutes: recommendationContext.availableMinutes,
          radiusKm: recommendationContext.maximumDistanceKm,
          spontaneityMode: mode,
        });
        if (result.error || !result.authenticated) capturedSession.writable = false;
      });
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setStatus('deciding');
    setRecommendation(undefined);
    if (decisionTimer.current) clearTimeout(decisionTimer.current);
    decisionTimer.current = setTimeout(() => {
      const next = makeRecommendation(ADELAIDE_PLACES, recommendationContext, mode);
      setRecommendation(next);
      setStatus(next ? 'result' : 'empty');
      if (next) {
        const recommendationId = user ? createPersistenceId() : null;
        currentRecommendationId.current = recommendationId;
        const capturedSession = session;
        if (recommendationId && capturedSession) {
          const capturedRecommendationId = recommendationId;
          enqueuePersistence(async () => {
            if (!capturedSession.writable) return;
            await persistShownRecommendation({
              id: capturedRecommendationId,
              sessionId: capturedSession.id,
              recommendation: next,
              rankPosition,
            });
          });
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }, 900);
  };

  const rejectRecommendation = () => {
    if (!recommendation) return;
    const recommendationId = currentRecommendationId.current;
    if (user && recommendationId) {
      enqueuePersistence(() => markRecommendationRejected(recommendationId));
    }
    const nextRejectedIds = [...rejectedIds, recommendation.place.id];
    setRejectedIds(nextRejectedIds);

    if (replacementCount >= MAX_REPLACEMENTS_PER_SESSION) {
      setStatus('limit');
      setRecommendation(undefined);
      return;
    }

    setReplacementCount((count) => count + 1);
    decide(nextRejectedIds, replacementCount + 2);
  };

  const acceptRecommendation = () => {
    if (!recommendation) return;
    const recommendationId = currentRecommendationId.current;
    if (user && recommendationId) {
      enqueuePersistence(() => markRecommendationAccepted(recommendationId));
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    router.push({
      pathname: '/recommendation/[id]',
      params: {
        id: recommendation.place.id,
        reason: recommendation.reason,
        ...(recommendationId ? { recommendationId } : {}),
      },
    });
  };

  const resetSession = () => {
    if (decisionTimer.current) {
      clearTimeout(decisionTimer.current);
      decisionTimer.current = null;
    }
    setStatus('idle');
    setRecommendation(undefined);
    setRejectedIds([]);
    setReplacementCount(0);
    persistenceSession.current = null;
    currentRecommendationId.current = null;
  };

  if (status !== 'idle') {
    return (
      <ScreenContainer contentStyle={styles.revealPage}>
        <View style={styles.revealHeader}>
          <BrandMark compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close recommendation"
            onPress={resetSession}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.charcoal} />
          </Pressable>
        </View>

        {status === 'deciding' ? (
          <View style={styles.deciding} accessibilityLiveRegion="polite">
            <DecisionMark loading />
            <Text style={styles.decidingTitle}>SponSays is deciding…</Text>
            <Text style={styles.decidingCopy}>One good call. No shortlist.</Text>
          </View>
        ) : status === 'result' && recommendation ? (
          <View style={styles.resultContent}>
            <Text style={styles.resultEyebrow}>SPONSAYS SAYS…</Text>
            <Text style={styles.resultTitle}>This is the one.</Text>
            <RevealCard
              recommendation={recommendation}
              onAccept={acceptRecommendation}
              onReject={rejectRecommendation}
            />
            <Text style={styles.replacementText}>{replacementCopy(replacementCount)}</Text>
          </View>
        ) : (
          <View style={styles.messageCard}>
            <DecisionMark />
            <Text style={styles.messageTitle}>
              {status === 'limit' ? 'Let’s change the vibe.' : 'Nothing fits all of that.'}
            </Text>
            <Text style={styles.messageCopy}>
              {status === 'limit'
                ? 'We’re clearly missing it. Change one thing and I’ll make another call.'
                : 'Relax one context choice and I’ll make another call.'}
            </Text>
            <PrimaryButton label="ADJUST CONTEXT" onPress={resetSession} />
          </View>
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.page}>
      <View style={styles.header}>
        <BrandMark compact />
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={14} color={colors.blueDark} />
          <Text style={styles.locationText}>Adelaide · Demo</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>What should we do?</Text>
        <Text style={styles.heroCopy}>Give me the moment. I’ll make the call.</Text>
      </View>

      <View style={styles.contextSection}>
        <Text style={styles.sectionLabel}>Your moment</Text>
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
      </View>

      <View style={styles.modeSection}>
        <View style={styles.modeHeading}>
          <Text style={styles.sectionLabel}>How spontaneous?</Text>
          <Text style={styles.modeCopy}>{MODE_COPY[mode]}</Text>
        </View>
        <ModeSelector value={mode} onChange={setMode} />
      </View>

      <View style={styles.actionSection}>
        <PrimaryButton
          label="SPONSAY ME ✦"
          onPress={() => decide()}
          accessibilityHint="Ask SponSays to choose one nearby experience"
        />
        <Text style={styles.actionNote}>One recommendation. That’s the point.</Text>
      </View>

      <View style={styles.locationPreview}>
        <View style={styles.locationIcon}>
          <Ionicons name="navigate" size={18} color={colors.blueDark} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationTitle}>Finding ideas near Adelaide CBD</Text>
          <Text style={styles.locationMeta}>Ready around Adelaide CBD</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={colors.blueDark} />
      </View>
    </ScreenContainer>
  );
}

function DecisionMark({ loading = false }: { loading?: boolean }) {
  return (
    <View style={styles.decisionMark}>
      <Text style={styles.markSpark}>✦</Text>
      {loading ? <ActivityIndicator color={colors.surface} style={styles.markLoader} /> : null}
    </View>
  );
}

function RevealCard({
  recommendation,
  onAccept,
  onReject,
}: {
  recommendation: RecommendationResult;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { place } = recommendation;
  return (
    <View style={styles.revealCard}>
      <View>
        <ExperienceArtwork style={styles.cardArtwork} />
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{place.category}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        <View style={styles.whyBlock}>
          <Text style={styles.whyLabel}>Why we picked this</Text>
          <Text style={styles.whyText}>{recommendation.reason}</Text>
        </View>
        <View style={styles.metaRow}>
          <MetaItem icon="navigate-outline" value={`${place.distanceKm ?? '—'} km`} />
          <MetaItem icon="time-outline" value={formatDuration(place.estimatedDurationMinutes ?? 60)} />
          <MetaItem icon="wallet-outline" value={formatPrice(place.priceLevel)} />
        </View>
        <PrimaryButton
          label="I’M IN"
          onPress={onAccept}
          accessibilityHint="Accept this recommendation"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not this one"
          onPress={onReject}
          style={({ pressed }) => [styles.rejectButton, pressed && styles.rejectPressed]}
        >
          <Text style={styles.rejectText}>Not this one</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetaItem({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.blueDark} />
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
  },
  locationText: { ...typography.caption, color: colors.blueDark, fontSize: 11 },
  hero: { gap: spacing.xs, marginTop: spacing.xxl },
  heroTitle: { ...typography.display, color: colors.charcoal, fontSize: 40, lineHeight: 44 },
  heroCopy: { ...typography.body, color: colors.charcoalSoft },
  contextSection: { gap: spacing.sm, marginTop: spacing.xl },
  sectionLabel: { ...typography.bodyStrong, color: colors.charcoal },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  modeSection: {
    gap: spacing.xs,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  modeHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  modeCopy: { ...typography.caption, color: colors.charcoalMuted, textAlign: 'right', flex: 1 },
  actionSection: { gap: spacing.xs, marginTop: spacing.md },
  actionNote: { ...typography.caption, color: colors.charcoalMuted, textAlign: 'center' },
  locationPreview: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.blueSoft,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: { flex: 1, gap: 2 },
  locationTitle: { ...typography.caption, color: colors.charcoal },
  locationMeta: { ...typography.caption, color: colors.charcoalMuted, fontSize: 10 },
  revealPage: { minHeight: '100%', paddingTop: spacing.md, paddingBottom: spacing.xxl },
  revealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deciding: { minHeight: 560, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge },
  decidingTitle: { ...typography.heading1, color: colors.charcoal, marginTop: spacing.xxl, textAlign: 'center' },
  decidingCopy: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.xs, textAlign: 'center' },
  decisionMark: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  markSpark: { color: colors.surface, fontSize: 34 },
  markLoader: { position: 'absolute', bottom: -38 },
  resultContent: { alignItems: 'center', paddingTop: spacing.xxl },
  resultEyebrow: { ...typography.caption, color: colors.blueDark, letterSpacing: 1.2 },
  resultTitle: { ...typography.heading1, color: colors.charcoal, marginTop: spacing.xs, marginBottom: spacing.lg },
  revealCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardArtwork: { height: 170 },
  categoryPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  categoryText: { ...typography.caption, color: colors.surface, fontSize: 11 },
  cardContent: { padding: spacing.sm, gap: spacing.md },
  cardTitle: { ...typography.heading2, color: colors.charcoal, fontSize: 24 },
  whyBlock: { gap: spacing.xxs },
  whyLabel: { ...typography.caption, color: colors.blueDark },
  whyText: { ...typography.caption, color: colors.charcoalSoft, fontWeight: '500' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
  },
  metaText: { ...typography.caption, color: colors.charcoal, fontSize: 11 },
  rejectButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  rejectPressed: { opacity: 0.65 },
  rejectText: { ...typography.bodyStrong, color: colors.charcoalSoft },
  replacementText: { ...typography.caption, color: colors.charcoalMuted, marginTop: spacing.md, textAlign: 'center' },
  messageCard: {
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  messageTitle: { ...typography.heading1, color: colors.charcoal, textAlign: 'center', marginTop: spacing.md },
  messageCopy: { ...typography.body, color: colors.charcoalSoft, textAlign: 'center', maxWidth: 340 },
});
