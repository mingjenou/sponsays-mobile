export interface Memory {
  id: string;
  externalPlaceId: string | null;
  placeName: string;
  category: string | null;
  createdAt: string;
  feedback: 'positive' | 'negative' | null;
}
