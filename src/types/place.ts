export interface PlaceCandidate {
  id: string;
  provider: 'mock' | 'google_places';
  providerId: string;
  source: 'mock' | 'google_places_text_search' | 'google_places_nearby_search';
  name: string;
  category?: string;
  types?: string[];
  latitude: number;
  longitude: number;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  reviewCount?: number;
  priceLevel?: number;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  isOpen?: boolean;
  servesVegetarianFood?: boolean;
  liveMusic?: boolean;
  googleMapsUri?: string;
  description?: string;
  sourceUrl?: string;
  imageUrl?: string;
  address?: string;
  tags: string[];
}
