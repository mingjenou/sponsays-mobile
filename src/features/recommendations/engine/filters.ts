import type { PlaceCandidate } from '@/src/types/place';
import type { RecommendationContext } from './types';

export const applyHardFilters = (
  candidates: PlaceCandidate[],
  context: RecommendationContext,
): PlaceCandidate[] =>
  candidates.filter((place) => {
    const hasValidCoordinates = Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
    const fitsDistance = (place.distanceKm ?? Number.POSITIVE_INFINITY) <= context.maximumDistanceKm;
    const fitsTime = context.availableMinutes === undefined ||
      place.estimatedDurationMinutes === undefined ||
      place.estimatedDurationMinutes <= context.availableMinutes;
    const fitsBudget =
      context.maximumPriceLevel === undefined ||
      (place.priceLevel ?? context.maximumPriceLevel) <= context.maximumPriceLevel;
    const isRejected =
      context.rejectedPlaceIds.includes(place.id) ||
      (place.providerId !== undefined && context.rejectedPlaceIds.includes(place.providerId));

    return (
      place.businessStatus !== 'CLOSED_PERMANENTLY' &&
      (!context.requireOpenNow || place.isOpen !== false) &&
      hasValidCoordinates &&
      fitsDistance &&
      fitsTime &&
      fitsBudget &&
      !isRejected
    );
  });
