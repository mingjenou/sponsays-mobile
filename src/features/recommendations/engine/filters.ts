import type { PlaceCandidate } from '@/src/types/place';
import type { RecommendationContext } from './types';

export const applyHardFilters = (
  candidates: PlaceCandidate[],
  context: RecommendationContext,
): PlaceCandidate[] =>
  candidates.filter((place) => {
    const hasValidCoordinates = Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
    const fitsDistance = (place.distanceKm ?? Number.POSITIVE_INFINITY) <= context.maximumDistanceKm;
    const fitsTime = (place.estimatedDurationMinutes ?? Number.POSITIVE_INFINITY) <= context.availableMinutes;
    const fitsBudget =
      context.maximumPriceLevel === undefined ||
      (place.priceLevel ?? context.maximumPriceLevel) <= context.maximumPriceLevel;

    return (
      place.isOpen !== false &&
      hasValidCoordinates &&
      fitsDistance &&
      fitsTime &&
      fitsBudget &&
      !context.rejectedPlaceIds.includes(place.id)
    );
  });
