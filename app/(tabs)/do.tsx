import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ExperienceArtwork } from '@/src/components/cards/ExperienceArtwork';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { MAX_REPLACEMENTS_PER_SESSION } from '@/src/constants/recommendations';
import { DiscoveryFilterModal } from '@/src/features/discovery/DiscoveryFilterModal';
import {
  createAuthDiscoveryReset,
  getDiscoveryProviderMode,
} from '@/src/features/discovery/authDiscoveryState';
import {
  createDiscoveryIntent,
  formatDiscoveryFilterSummary,
  mapDiscoveryFiltersToConstraints,
  mapDiscoveryFiltersToSessionFields,
} from '@/src/features/discovery/intent';
import { DEFAULT_DISCOVERY_FILTERS } from '@/src/features/discovery/options';
import type { DiscoveryFilters } from '@/src/features/discovery/types';
import { discoverRealPlaces } from '@/src/features/discovery/discoveryService';
import { getDiscoveryLocation, type DiscoveryLocation } from '@/src/features/discovery/locationService';
import { useAuth } from '@/src/features/auth/useAuth';
import {
  CURRENT_RECOMMENDATION_BEHAVIOUR,
  makeRecommendation,
  type RecommendationContext,
  type RecommendationResult,
} from '@/src/features/recommendations/engine';
import {
  createRecommendationSession,
  markRecommendationAccepted,
  markRecommendationRejected,
  persistShownRecommendation,
} from '@/src/features/recommendations/persistenceService';
import { trackRecommendationPersistence } from '@/src/features/recommendations/persistenceReadiness';
import { cacheRecommendation } from '@/src/features/recommendations/recommendationCache';
import { ADELAIDE_PLACES } from '@/src/mocks/places';
import { createPersistenceId, logDataError } from '@/src/services/supabase/service';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { formatDuration } from '@/src/utils/formatDuration';
import type { PlaceCandidate } from '@/src/types/place';

type DecisionStatus = 'idle' | 'deciding' | 'result' | 'limit' | 'empty';

const replacementCopy = (count: number): string => {
  if (count === 1) return 'Okay, another one.';
  if (count === 2) return 'One more?';
  if (count === 3) return 'Last switch before we change the vibe.';
  return 'Not feeling it? I can make another call.';
};

const formatPrice = (priceLevel?: number): string =>
  priceLevel === undefined ? 'Price unknown' : priceLevel === 0 ? 'Free' : '$'.repeat(priceLevel);

const formatDistance = (distanceKm?: number): string =>
  distanceKm === undefined ? 'Distance unknown' : `${distanceKm} km`;

const formatTime = (minutes?: number): string =>
  minutes === undefined ? 'Time varies' : formatDuration(minutes);

export default function DoScreen() {
  const { user } = useAuth();
  const authIdentity = user?.id ?? null;
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_DISCOVERY_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [status, setStatus] = useState<DecisionStatus>('idle');
  const [recommendation, setRecommendation] = useState<RecommendationResult>();
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [replacementCount, setReplacementCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState('Adelaide · Demo');
  const [providerMessage, setProviderMessage] = useState<string>();
  const providerHealth = useRef<'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'>('HEALTHY');
  const decisionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidatePool = useRef<PlaceCandidate[] | null>(null);
  const discoveryLocation = useRef<DiscoveryLocation | null>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const persistenceSession = useRef<{ id: string; writable: boolean } | null>(null);
  const currentRecommendationId = useRef<string | null>(null);
  const authGeneration = useRef(0);
  const activeAuthIdentity = useRef<string | null>(authIdentity);

  useEffect(() => {
    const reset = createAuthDiscoveryReset(authIdentity);
    authGeneration.current += 1;
    activeAuthIdentity.current = authIdentity;
    if (decisionTimer.current) clearTimeout(decisionTimer.current);
    decisionTimer.current = null;
    candidatePool.current = reset.candidatePool;
    discoveryLocation.current = reset.discoveryLocation;
    persistenceSession.current = reset.persistenceSession;
    currentRecommendationId.current = reset.currentRecommendationId;
    persistenceQueue.current = Promise.resolve();
    setRejectedIds(reset.rejectedIds);
    setReplacementCount(reset.replacementCount);
    setProviderMessage(reset.providerMessage);
    providerHealth.current = reset.providerHealth;
    setRecommendation(reset.recommendation);
    setStatus(reset.status);
    setLocationLabel(reset.locationLabel);
  }, [authIdentity]);

  useEffect(
    () => () => {
      if (decisionTimer.current) clearTimeout(decisionTimer.current);
    },
    [],
  );

  const buildContext = (rejections: string[]): RecommendationContext => {
    const discoveryIntent = createDiscoveryIntent(query, filters);
    const constraints = mapDiscoveryFiltersToConstraints(filters);
    return {
      discoveryIntent,
      interests: ['outdoors', 'culture', 'hidden gems', 'entertainment'],
      ...(constraints.maximumPriceLevel === undefined
        ? {}
        : { maximumPriceLevel: constraints.maximumPriceLevel }),
      maximumDistanceKm: 15,
      availableMinutes: constraints.availableMinutes,
      partySize: constraints.partySize,
      requireOpenNow: filters.timePreference === 'now',
      rejectedPlaceIds: rejections,
    };
  };

  const enqueuePersistence = (operation: () => Promise<unknown>): Promise<void> => {
    const operationGeneration = authGeneration.current;
    persistenceQueue.current = persistenceQueue.current
      .then(async () => {
        if (authGeneration.current !== operationGeneration) return;
        await operation();
      })
      .catch((error: unknown) => logDataError('persistence-queue', error));
    return persistenceQueue.current;
  };

  const decide = async (rejections = rejectedIds, rankPosition = replacementCount + 1) => {
    const decisionAuthIdentity = authIdentity;
    const decisionGeneration = authGeneration.current;
    const authChanged = () =>
      authGeneration.current !== decisionGeneration ||
      activeAuthIdentity.current !== decisionAuthIdentity;
    const recommendationContext = buildContext(rejections);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setStatus('deciding');
    setRecommendation(undefined);
    if (decisionTimer.current) clearTimeout(decisionTimer.current);

    let candidates = candidatePool.current;
    if (!candidates) {
      if (getDiscoveryProviderMode(decisionAuthIdentity) === 'live') {
        const location = await getDiscoveryLocation();
        if (authChanged()) return;
        discoveryLocation.current = location;
        setLocationLabel(location.label);
        const live = await discoverRealPlaces({
          query,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: recommendationContext.maximumDistanceKm * 1_000,
          timePreference: filters.timePreference,
          budget: filters.budget,
          partySize: filters.partySize,
          maxCandidates: 12,
        });
        if (authChanged()) return;
        providerHealth.current = live.health;
        if (live.candidates.length > 0) {
          candidates = live.candidates;
          setProviderMessage(location.message);
        } else {
          candidates = ADELAIDE_PLACES;
          setLocationLabel('Adelaide · Demo fallback');
          setProviderMessage(`${live.message ?? 'Live discovery is unavailable.'} Using Adelaide demo ideas instead.`);
        }
      } else {
        candidates = ADELAIDE_PLACES;
        setLocationLabel('Adelaide · Demo');
        providerHealth.current = 'HEALTHY';
        setProviderMessage(undefined);
      }
      candidatePool.current = candidates;
    }

    const sessionFields = mapDiscoveryFiltersToSessionFields(filters, recommendationContext.maximumDistanceKm);
    let session = persistenceSession.current;
    if (user && !session) {
      session = { id: createPersistenceId(), writable: true };
      persistenceSession.current = session;
      const capturedSession = session;
      const location = discoveryLocation.current;
      enqueuePersistence(async () => {
        const result = await createRecommendationSession({
          id: capturedSession.id,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          ...sessionFields,
          spontaneityMode: CURRENT_RECOMMENDATION_BEHAVIOUR,
        });
        if (result.error || !result.authenticated) capturedSession.writable = false;
      });
    }

    decisionTimer.current = setTimeout(() => {
      if (authChanged()) return;
      const next = makeRecommendation(candidates ?? ADELAIDE_PLACES, recommendationContext);
      setRecommendation(next);
      setStatus(next ? 'result' : 'empty');
      if (next) {
        if (__DEV__) console.info(`[SponSays discovery] source=${next.place.provider ?? 'mock'} providerPlaceId=${next.place.providerId ?? next.place.id} health=${providerHealth.current}`);
        const recommendationId = user ? createPersistenceId() : null;
        currentRecommendationId.current = recommendationId;
        const capturedSession = session;
        if (recommendationId && capturedSession) {
          const capturedRecommendationId = recommendationId;
          const persistence = enqueuePersistence(async () => {
            if (!capturedSession.writable) return;
            await persistShownRecommendation({
              id: capturedRecommendationId,
              sessionId: capturedSession.id,
              recommendation: next,
              rankPosition,
            });
          });
          trackRecommendationPersistence(capturedRecommendationId, persistence);
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }, 450);
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
    void decide(nextRejectedIds, replacementCount + 2);
  };

  const acceptRecommendation = () => {
    if (!recommendation) return;
    const recommendationId = currentRecommendationId.current;
    if (user && recommendationId) {
      enqueuePersistence(() => markRecommendationAccepted(recommendationId));
    }
    const routeKey = recommendationId ?? `demo-${recommendation.place.id}`;
    cacheRecommendation(routeKey, recommendation);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    router.push({
      pathname: '/recommendation/[id]',
      params: {
        id: routeKey,
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
    candidatePool.current = null;
    discoveryLocation.current = null;
    setProviderMessage(undefined);
    providerHealth.current = 'HEALTHY';
    setLocationLabel(user ? 'Location used when you SponSay' : 'Adelaide · Demo');
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

        {providerMessage ? (
          <Text accessibilityLiveRegion="polite" style={styles.providerMessage}>{providerMessage}</Text>
        ) : null}

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
                : 'Try a broader idea or relax one filter and I’ll make another call.'}
            </Text>
            <PrimaryButton label="ADJUST SEARCH" onPress={resetSession} />
          </View>
        )}
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer contentStyle={styles.page}>
        <View style={styles.header}>
          <BrandMark compact />
          <View style={styles.locationPill}>
            <Ionicons name="location-outline" size={14} color={colors.blueDark} />
            <Text style={styles.locationText}>{locationLabel}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>What should we do?</Text>
          <Text style={styles.heroCopy}>Give me an idea, or leave it blank and let me surprise you.</Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <Ionicons name="sparkles-outline" size={20} color={colors.blueDark} />
              <TextInput
                accessibilityLabel="Search an idea"
                autoCapitalize="sentences"
                enterKeyHint="go"
                onChangeText={setQuery}
                onSubmitEditing={() => void decide()}
                placeholder="Search an idea..."
                placeholderTextColor={colors.charcoalMuted}
                returnKeyType="go"
                style={styles.searchInput}
                value={query}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filters"
              onPress={() => setFiltersVisible(true)}
              style={({ pressed }) => [styles.filterButton, pressed && styles.filterPressed]}
            >
              <Ionicons name="options-outline" size={23} color={colors.blueDark} />
            </Pressable>
          </View>
          <View style={styles.filterSummary} accessibilityLabel={`Selected filters: ${formatDiscoveryFilterSummary(filters)}`}>
            <Ionicons name="time-outline" size={15} color={colors.charcoalMuted} />
            <Text style={styles.filterSummaryText}>{formatDiscoveryFilterSummary(filters)}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <PrimaryButton
            label="SPONSAY ME ✦"
            onPress={() => void decide()}
            accessibilityHint="Ask SponSays to choose one experience from your idea and filters"
          />
          <Text style={styles.actionNote}>One recommendation. That’s the point.</Text>
        </View>

        <View style={styles.locationPreview}>
          <View style={styles.locationIcon}>
            <Ionicons name="navigate" size={18} color={colors.blueDark} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationTitle}>{user ? 'Real places when live discovery is configured' : 'Adelaide demo ideas'}</Text>
            <Text style={styles.locationMeta}>{user ? 'Location is requested only when you SponSay' : 'No account or location permission required'}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={colors.blueDark} />
        </View>
      </ScreenContainer>
      <DiscoveryFilterModal
        filters={filters}
        visible={filtersVisible}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setFiltersVisible(false);
        }}
        onClose={() => setFiltersVisible(false)}
      />
    </>
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
          <Text style={styles.categoryText}>{place.category ?? 'Place'}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        <View style={styles.whyBlock}>
          <Text style={styles.whyLabel}>Why we picked this</Text>
          <Text style={styles.whyText}>{recommendation.reason}</Text>
        </View>
        <View style={styles.metaRow}>
          <MetaItem icon="navigate-outline" value={formatDistance(place.distanceKm)} />
          <MetaItem icon="time-outline" value={formatTime(place.estimatedDurationMinutes)} />
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
  searchSection: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchField: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  searchInput: { ...typography.body, flex: 1, color: colors.charcoal, paddingVertical: spacing.sm },
  filterButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: radius.lg,
    backgroundColor: colors.blueSoft,
  },
  filterPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  filterSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  filterSummaryText: { ...typography.caption, color: colors.charcoalSoft },
  actionSection: { gap: spacing.xs, marginTop: spacing.lg },
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
  providerMessage: { ...typography.caption, color: colors.charcoalSoft, marginTop: spacing.sm, textAlign: 'center' },
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
