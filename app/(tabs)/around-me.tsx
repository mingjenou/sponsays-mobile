import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { useAuth } from '@/src/features/auth/useAuth';
import { discoverNearbyPlaces } from '@/src/features/discovery/aroundMeService';
import { ADELAIDE_FALLBACK_LOCATION, getDiscoveryLocation, type DiscoveryLocation } from '@/src/features/discovery/locationService';
import { dedupeNearbyCandidates, getAroundMeProviderMode, selectNearbyCandidate, type AroundCategory } from '@/src/features/discovery/nearbyPlaces';
import { getCandidateDescription, getCandidateSourceUrl } from '@/src/features/recommendations/candidateDescription';
import { openDirections } from '@/src/features/places/placeLinks';
import { ADELAIDE_PLACES } from '@/src/mocks/places';
import type { PlaceCandidate } from '@/src/types/place';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';

const categories: { value: AroundCategory; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'food', label: 'Food' }, { value: 'coffee', label: 'Coffee' },
  { value: 'outdoors', label: 'Outdoors' }, { value: 'culture', label: 'Culture' }, { value: 'entertainment', label: 'Entertainment' },
];
const initialRegion: Region = { ...ADELAIDE_FALLBACK_LOCATION, latitudeDelta: 0.11, longitudeDelta: 0.11 };

const localMatches = (candidate: PlaceCandidate, category: AroundCategory, query: string): boolean => {
  const haystack = [candidate.name, candidate.category, ...candidate.tags].join(' ').toLowerCase();
  const categoryNeedle = category === 'all' ? '' : category;
  return (!categoryNeedle || haystack.includes(categoryNeedle) || (category === 'coffee' && haystack.includes('cafe'))) &&
    (!query.trim() || haystack.includes(query.trim().toLowerCase()));
};

export default function AroundMeScreen() {
  const { user } = useAuth();
  const authIdentity = user?.id ?? null;
  const map = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AroundCategory>('all');
  const [region, setRegion] = useState<Region>(initialRegion);
  const [searchRegion, setSearchRegion] = useState<Region>(initialRegion);
  const [location, setLocation] = useState<DiscoveryLocation>();
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [areaMoved, setAreaMoved] = useState(false);
  const generation = useRef(0);

  const search = async (center: Region, nextCategory = category, nextQuery = query, requestedLocation = location) => {
    const token = generation.current;
    setLoading(true); setMessage(undefined); setAreaMoved(false);
    if (getAroundMeProviderMode(authIdentity) === 'demo') {
      const demo = dedupeNearbyCandidates(ADELAIDE_PLACES.filter((candidate) => localMatches(candidate, nextCategory, nextQuery)));
      if (token !== generation.current) return;
      setCandidates(demo); setSelectedId(demo[0]?.providerId); setLoading(false);
      if (!demo.length) setMessage('No Adelaide demo places match that search.');
      return;
    }
    const result = await discoverNearbyPlaces({ latitude: center.latitude, longitude: center.longitude, radiusMeters: 5_000, maxCandidates: 20, category: nextCategory, query: nextQuery });
    if (token !== generation.current) return;
    setCandidates(result.candidates); setSelectedId(result.candidates[0]?.providerId); setLoading(false);
    if (result.message) setMessage(result.message);
    else if (!result.candidates.length) setMessage('No nearby places matched this area.');
    if (requestedLocation?.source === 'adelaide_fallback') setMessage((current) => requestedLocation.message ?? current);
  };

  useEffect(() => {
    generation.current += 1;
    const token = generation.current;
    setCandidates([]); setSelectedId(undefined); setMessage(undefined); setAreaMoved(false);
    if (!authIdentity) {
      setLocation({ ...ADELAIDE_FALLBACK_LOCATION, source: 'adelaide_fallback', label: 'Adelaide · Demo' });
      setRegion(initialRegion); setSearchRegion(initialRegion);
      void search(initialRegion, category, query, undefined);
      return;
    }
    setLoading(true);
    void getDiscoveryLocation().then((nextLocation) => {
      if (token !== generation.current) return;
      const nextRegion = { latitude: nextLocation.latitude, longitude: nextLocation.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 };
      setLocation(nextLocation); setRegion(nextRegion); setSearchRegion(nextRegion);
      map.current?.animateToRegion(nextRegion, 350);
      void search(nextRegion, category, query, nextLocation);
    });
  // Search/filter state intentionally survives tab use; identity changes reset provider data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authIdentity]);

  const selected = useMemo(() => selectedId ? selectNearbyCandidate(candidates, selectedId) : candidates[0], [candidates, selectedId]);
  const choose = (candidate: PlaceCandidate) => {
    setSelectedId(candidate.providerId);
    map.current?.animateToRegion({ latitude: candidate.latitude, longitude: candidate.longitude, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }, 250);
  };
  const applyCategory = (value: AroundCategory) => { setCategory(value); void search(searchRegion, value, query); };

  return (
    <ScreenContainer>
      <BrandMark compact />
      <Text style={styles.eyebrow}>{user ? 'AROUND YOU' : 'ADELAIDE · DEMO'}</Text>
      <Text style={styles.title}>Explore what’s nearby.</Text>
      <Text style={styles.description}>{user ? location?.source === 'device' ? 'Live places around your current location.' : 'Using a clearly labelled Adelaide fallback.' : 'Local mock places. Sign in for live nearby discovery.'}</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={colors.blueDark} />
        <TextInput accessibilityLabel="Search nearby" placeholder="Search nearby..." placeholderTextColor={colors.charcoalMuted} value={query} onChangeText={setQuery} onSubmitEditing={() => void search(searchRegion)} returnKeyType="search" style={styles.searchInput} />
        <Pressable accessibilityRole="button" accessibilityLabel="Search nearby" onPress={() => void search(searchRegion)}><Ionicons name="arrow-forward-circle" size={28} color={colors.coral} /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: category === item.value }} onPress={() => applyCategory(item.value)} style={[styles.chip, category === item.value && styles.chipSelected]}><Text style={[styles.chipText, category === item.value && styles.chipTextSelected]}>{item.label}</Text></Pressable>)}
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView ref={map} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={initialRegion} showsUserLocation={location?.source === 'device'} showsMyLocationButton={location?.source === 'device'} onRegionChangeComplete={(next) => { setRegion(next); setSearchRegion(next); setAreaMoved(true); }}>
          {candidates.map((candidate) => <Marker key={candidate.providerId} identifier={candidate.providerId} coordinate={{ latitude: candidate.latitude, longitude: candidate.longitude }} title={candidate.name} accessibilityLabel={candidate.name} pinColor={selectedId === candidate.providerId ? colors.coral : colors.blueDark} onPress={() => setSelectedId(candidate.providerId)} />)}
        </MapView>
        {areaMoved ? <Pressable accessibilityRole="button" onPress={() => void search(searchRegion)} style={styles.searchArea}><Text style={styles.searchAreaText}>Search this area</Text></Pressable> : null}
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.blueDark} /><Text style={styles.loadingText}>Finding nearby places…</Text></View> : null}
      </View>
      {user && candidates.some((candidate) => candidate.provider === 'google_places') ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://maps.google.com')} style={styles.attribution}><Text style={styles.attributionText}>Places data · Google Maps</Text></Pressable> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} accessibilityLabel="Nearby place previews">
        {candidates.map((candidate) => <Pressable key={candidate.providerId} accessibilityRole="button" accessibilityState={{ selected: selected?.providerId === candidate.providerId }} onPress={() => choose(candidate)} style={[styles.preview, selected?.providerId === candidate.providerId && styles.previewSelected]}>
          <Text style={styles.previewName}>{candidate.name}</Text><Text style={styles.previewMeta}>{candidate.category ?? 'Place'}{candidate.distanceKm === undefined ? '' : ` · ${candidate.distanceKm} km`}</Text><Text numberOfLines={3} style={styles.previewDescription}>{getCandidateDescription(candidate)}</Text>
          <View style={styles.previewLinks}>{getCandidateSourceUrl(candidate) ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(getCandidateSourceUrl(candidate)!)}><Text style={styles.link}>Read more</Text></Pressable> : null}<Pressable accessibilityRole="button" onPress={() => void openDirections(candidate)}><Text style={styles.link}>Directions</Text></Pressable></View>
        </Pressable>)}
      </ScrollView>
      {selected ? <PrimaryButton label="SponSays" onPress={() => router.navigate('/(tabs)/do')} accessibilityHint="Return to Do for one SponSays recommendation" /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...typography.caption, color: colors.coral, letterSpacing: 1, marginTop: spacing.xl }, title: { ...typography.heading1, color: colors.charcoal, marginTop: spacing.xs }, description: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.xs },
  searchRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card }, searchInput: { ...typography.body, color: colors.charcoal, flex: 1 },
  categories: { gap: spacing.xs, paddingVertical: spacing.md }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, chipSelected: { backgroundColor: colors.blue, borderColor: colors.blue }, chipText: { ...typography.caption, color: colors.charcoal }, chipTextSelected: { color: colors.surface },
  mapWrap: { height: 360, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.creamDeep }, map: { flex: 1 }, searchArea: { position: 'absolute', top: spacing.sm, alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.charcoal, ...shadows.card }, searchAreaText: { ...typography.bodyStrong, color: colors.surface }, loading: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.md }, loadingText: { ...typography.caption, color: colors.charcoal },
  attribution: { alignSelf: 'flex-end', minHeight: 34, justifyContent: 'center' }, attributionText: { ...typography.caption, color: colors.charcoalSoft, textDecorationLine: 'underline', fontSize: 10 }, message: { ...typography.caption, color: colors.charcoalSoft, backgroundColor: colors.creamDeep, padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.sm },
  carousel: { gap: spacing.sm, paddingVertical: spacing.md }, preview: { width: 276, minHeight: 180, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, previewSelected: { borderColor: colors.blue, borderWidth: 2 }, previewName: { ...typography.heading2, color: colors.charcoal }, previewMeta: { ...typography.caption, color: colors.blueDark, marginTop: spacing.xxs }, previewDescription: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.sm }, previewLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: spacing.md }, link: { ...typography.bodyStrong, color: colors.blueDark, textDecorationLine: 'underline' },
});
