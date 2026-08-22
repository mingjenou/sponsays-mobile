import type { PlaceCandidate } from '@/src/types/place';

const sentence = (value: string): string => /[.!?]$/.test(value) ? value : `${value}.`;

export const getCandidateDescription = (candidate: PlaceCandidate): string => {
  const verified = candidate.description?.trim();
  if (verified) return sentence(verified);

  const kind = candidate.category?.trim() || 'Place';
  if (candidate.address?.trim()) return `${kind} at ${candidate.address.trim()}.`;
  if (candidate.distanceKm !== undefined) return `${kind} around ${candidate.distanceKm} km away.`;
  return `${kind} near the selected area.`;
};

export const getCandidateSourceUrl = (candidate: PlaceCandidate): string | undefined => {
  const value = candidate.sourceUrl ?? candidate.googleMapsUri;
  return value && /^https?:\/\//i.test(value) ? value : undefined;
};
