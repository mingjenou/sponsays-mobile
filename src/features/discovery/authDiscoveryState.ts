export type DiscoveryProviderMode = 'live' | 'demo';

export const getDiscoveryProviderMode = (userId?: string | null): DiscoveryProviderMode =>
  userId ? 'live' : 'demo';

export const createAuthDiscoveryReset = (userId?: string | null) => ({
  candidatePool: null,
  candidatePoolKey: null,
  discoveryLocation: null,
  persistenceSession: null,
  currentRecommendationId: null,
  rejectedIds: [] as string[],
  replacementCount: 0,
  providerMessage: undefined,
  providerHealth: 'HEALTHY' as const,
  recommendation: undefined,
  status: 'idle' as const,
  locationLabel: userId ? 'Location used when you SponSay' : 'Adelaide · Demo',
  providerMode: getDiscoveryProviderMode(userId),
});
