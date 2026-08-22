import type { PlaceCandidate } from '@/src/types/place';
import type { DiscoveryIntent } from './types';

interface KeywordRule {
  patterns: string[];
  candidateTerms: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    patterns: ['hike', 'hiking', 'walk', 'walking', 'nature', 'outdoor', 'outdoors'],
    candidateTerms: ['outdoors', 'walking', 'adventure', 'walk'],
  },
  {
    patterns: ['vegetarian', 'veggie'],
    candidateTerms: ['vegetarian'],
  },
  {
    patterns: ['food', 'eat', 'dinner', 'lunch'],
    candidateTerms: ['food', 'food & drinks'],
  },
  {
    patterns: ['live music', 'music', 'concert', 'gig'],
    candidateTerms: ['nightlife', 'entertainment', 'culture'],
  },
  {
    patterns: ['coffee', 'cafe', 'café'],
    candidateTerms: ['coffee'],
  },
  {
    patterns: ['art', 'exhibition', 'gallery'],
    candidateTerms: ['culture', 'gallery'],
  },
  {
    patterns: ['free'],
    candidateTerms: ['free'],
  },
  {
    patterns: ['unusual', 'hidden', 'surprise'],
    candidateTerms: ['hidden gems', 'hidden gem'],
  },
];

const includesPhrase = (query: string, pattern: string): boolean =>
  query === pattern || query.includes(`${pattern} `) || query.includes(` ${pattern}`);

export const getDiscoveryCandidateTerms = (intent: DiscoveryIntent): string[] => {
  if (!intent.normalizedQuery) return [];

  return Array.from(
    new Set(
      KEYWORD_RULES.flatMap((rule) =>
        rule.patterns.some((pattern) => includesPhrase(intent.normalizedQuery, pattern))
          ? rule.candidateTerms
          : [],
      ),
    ),
  );
};

export const matchDiscoveryIntent = (
  candidate: PlaceCandidate,
  intent: DiscoveryIntent,
): number => {
  const terms = getDiscoveryCandidateTerms(intent);
  if (terms.length === 0) return 0;

  const candidateText = [candidate.name, candidate.category ?? '', ...candidate.tags]
    .join(' ')
    .toLowerCase();
  const matches = terms.filter((term) => candidateText.includes(term)).length;
  return Math.min(1, matches / Math.min(terms.length, 2));
};

export const preferDiscoveryIntentMatches = (
  candidates: PlaceCandidate[],
  intent: DiscoveryIntent,
): PlaceCandidate[] => {
  const query = intent.normalizedQuery;
  const requiresHiking = /\b(hike|hiking|trail|walk|walking)\b/.test(query);
  const requiresVegetarian = /\b(vegetarian|veggie|vegan)\b/.test(query);
  const requiresLiveMusic = /\b(live music|concert|gig)\b/.test(query);
  if (requiresHiking || requiresVegetarian || requiresLiveMusic) {
    return candidates.filter((candidate) => {
      const metadata = new Set([
        ...candidate.tags,
        ...(candidate.types ?? []).map((type) => type.replaceAll('_', ' ')),
      ]);
      if (requiresHiking) {
        return ['hiking area', 'park', 'national park', 'botanical garden', 'outdoors', 'walking', 'adventure']
          .some((term) => metadata.has(term));
      }
      if (requiresVegetarian) {
        return candidate.servesVegetarianFood === true || metadata.has('vegetarian') || metadata.has('vegetarian restaurant');
      }
      return candidate.liveMusic === true || ['live music', 'live music venue', 'concert hall', 'performing arts theater', 'night club', 'nightlife', 'entertainment', 'culture']
        .some((term) => metadata.has(term));
    });
  }

  const matchedCandidates = candidates.filter(
    (candidate) => matchDiscoveryIntent(candidate, intent) > 0,
  );
  return matchedCandidates.length > 0 ? matchedCandidates : candidates;
};
