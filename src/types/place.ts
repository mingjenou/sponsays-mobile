export interface PlaceCandidate {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  isOpen?: boolean;
  imageUrl?: string;
  address: string;
  tags: string[];
}
