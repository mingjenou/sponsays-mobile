import { CURRENT_RECOMMENDATION_BEHAVIOUR } from '@/src/features/recommendations/engine';

export interface SettingsFormValue {
  displayName: string;
  homeCity: string;
  interests: string[];
  dietaryPreferences: string[];
  budget: string;
  distanceKm: number;
  socialContext: string;
}

interface PersistenceResult {
  error: { message: string } | null;
}

export interface SettingsPersistenceGateway {
  updateProfile: (input: {
    displayName: string | null;
    homeCity: string | null;
  }) => Promise<PersistenceResult>;
  savePreferences: (input: {
    interests: string[];
    dietaryPreferences: string[];
    defaultBudget: string | null;
    defaultDistanceKm: number | null;
    defaultSocialContext: string | null;
    defaultSpontaneityMode: typeof CURRENT_RECOMMENDATION_BEHAVIOUR;
  }) => Promise<PersistenceResult>;
}

export type SettingsSaveStatus = 'saved' | 'demo' | 'failed';

export const saveSettings = async (
  signedIn: boolean,
  value: SettingsFormValue,
  gateway: SettingsPersistenceGateway,
): Promise<SettingsSaveStatus> => {
  if (!signedIn) return 'demo';

  const [profileResult, preferencesResult] = await Promise.all([
    gateway.updateProfile({
      displayName: value.displayName.trim() || null,
      homeCity: value.homeCity.trim() || null,
    }),
    gateway.savePreferences({
      interests: value.interests,
      dietaryPreferences: value.dietaryPreferences,
      defaultBudget: value.budget || null,
      defaultDistanceKm: value.distanceKm,
      defaultSocialContext: value.socialContext || null,
      defaultSpontaneityMode: CURRENT_RECOMMENDATION_BEHAVIOUR,
    }),
  ]);

  return profileResult.error || preferencesResult.error ? 'failed' : 'saved';
};
