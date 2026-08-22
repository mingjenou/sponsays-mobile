import * as Location from 'expo-location';

export const ADELAIDE_FALLBACK_LOCATION = {
  latitude: -34.9285,
  longitude: 138.6007,
} as const;

export interface DiscoveryLocation {
  latitude: number;
  longitude: number;
  source: 'device' | 'adelaide_fallback';
  label: string;
  message?: string;
}

const fallback = (message: string): DiscoveryLocation => ({
  ...ADELAIDE_FALLBACK_LOCATION,
  source: 'adelaide_fallback',
  label: 'Adelaide · Fallback',
  message,
});

export const getDiscoveryLocation = async (): Promise<DiscoveryLocation> => {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    const permission = existing.granted ? existing : await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return fallback('Location permission is off, so I’m using central Adelaide as a clearly labelled fallback.');
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Location request timed out.')), 8_000),
      ),
    ]);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: 'device',
      label: 'Current location',
    };
  } catch {
    return fallback('I couldn’t get a current location, so I’m using central Adelaide as a fallback.');
  }
};
