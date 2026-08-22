import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
export interface PlaceLinkTarget {
  latitude: number;
  longitude: number;
  googleMapsUri?: string;
}

export const getDirectionsUrl = (place: PlaceLinkTarget, platform = Platform.OS): string => {
  const destination = encodeURIComponent(`${place.latitude},${place.longitude}`);
  return platform === 'ios'
    ? `http://maps.apple.com/?daddr=${destination}`
    : place.googleMapsUri ?? `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};

export const openDirections = async (place: PlaceLinkTarget): Promise<void> => {
  const url = getDirectionsUrl(place);
  if (await Linking.canOpenURL(url)) await Linking.openURL(url);
};
