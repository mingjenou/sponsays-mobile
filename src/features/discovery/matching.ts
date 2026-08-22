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

  const candidateText = [candidate.name, candidate.category, ...candidate.tags]
    .join(' ')
    .toLowerCase();
  const matches = terms.filter((term) => candidateText.includes(term)).length;
  return Math.min(1, matches / Math.min(terms.length, 2));
};

export const preferDiscoveryIntentMatches = (
  candidates: PlaceCandidate[],
  intent: DiscoveryIntent,
): PlaceCandidate[] => {
  const matchedCandidates = candidates.filter(
    (candidate) => matchDiscoveryIntent(candidate, intent) > 0,
  );
  return matchedCandidates.length > 0 ? matchedCandidates : candidates;
};
