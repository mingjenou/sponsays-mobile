import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ContextChip } from '@/src/components/chips/ContextChip';
import { ModeSelector } from '@/src/components/chips/ModeSelector';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { useAuth } from '@/src/features/auth/useAuth';
import { getMyPreferences, saveMyPreferences } from '@/src/features/profile/preferenceService';
import { getMyProfile, updateMyProfile } from '@/src/features/profile/profileService';
import {
  saveSettings,
  type SettingsFormValue,
  type SettingsSpontaneityMode,
} from '@/src/features/profile/settingsPersistence';
import { colors, radius, spacing, typography } from '@/src/theme';

const INTERESTS = ['Food', 'Coffee', 'Outdoors', 'Culture', 'Activities', 'Hidden gems'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten free'];
const BUDGETS = ['Free', '$', '$$', '$$$', 'Flexible'];
const SOCIAL_OPTIONS = ['Solo', 'Couple', 'Friends', 'Family'];
const DISTANCES = [2, 5, 10, 15];

const DEFAULT_SETTINGS: SettingsFormValue = {
  displayName: '',
  homeCity: '',
  interests: ['Outdoors', 'Culture'],
  dietaryPreferences: [],
  budget: '$$',
  distanceKm: 5,
  socialContext: 'Couple',
  spontaneityMode: 'spontaneous',
};

const isSpontaneityMode = (value: string): value is SettingsSpontaneityMode =>
  value === 'safe' || value === 'spontaneous' || value === 'chaos';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsFormValue>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      setMessage(undefined);
      return;
    }

    let active = true;
    setLoading(true);
    setMessage(undefined);
    void Promise.all([getMyProfile(), getMyPreferences()]).then(([profileResult, preferencesResult]) => {
      if (!active) return;
      setLoading(false);

      setSettings((current) => ({
        ...current,
        ...(profileResult.data
          ? {
              displayName: profileResult.data.display_name ?? '',
              homeCity: profileResult.data.home_city ?? '',
            }
          : {}),
        ...(preferencesResult.data
          ? {
              interests: preferencesResult.data.interests,
              dietaryPreferences: preferencesResult.data.dietary_preferences,
              budget: preferencesResult.data.default_budget ?? current.budget,
              distanceKm: preferencesResult.data.default_distance_km ?? current.distanceKm,
              socialContext: preferencesResult.data.default_social_context ?? current.socialContext,
              spontaneityMode: isSpontaneityMode(preferencesResult.data.default_spontaneity_mode)
                ? preferencesResult.data.default_spontaneity_mode
                : current.spontaneityMode,
            }
          : {}),
      }));

      if (profileResult.error || preferencesResult.error) {
        setMessageTone('error');
        setMessage("We couldn't load all of your saved settings. You can still edit and try again.");
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const visibleInterests = useMemo(
    () => Array.from(new Set([...INTERESTS, ...settings.interests])),
    [settings.interests],
  );
  const visibleDietaryOptions = useMemo(
    () => Array.from(new Set([...DIETARY_OPTIONS, ...settings.dietaryPreferences])),
    [settings.dietaryPreferences],
  );

  const toggleListValue = (
    field: 'interests' | 'dietaryPreferences',
    value: string,
  ) => {
    setMessage(undefined);
    setSettings((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(undefined);
    const status = await saveSettings(Boolean(user), settings, {
      updateProfile: updateMyProfile,
      savePreferences: saveMyPreferences,
    });
    setSaving(false);

    if (status === 'failed') {
      setMessageTone('error');
      setMessage("We couldn't save those changes right now. Your choices are still here.");
      return;
    }

    setMessageTone('success');
    setMessage(
      status === 'saved'
        ? 'Saved. Your profile is up to date.'
        : "Demo choices stay local and aren't saved to an account.",
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.spacer}>{loading ? <ActivityIndicator color={colors.blueDark} /> : null}</View>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{user ? 'Make SponSays feel like yours.' : 'Try your preferences.'}</Text>
        <Text style={styles.copy}>
          {user
            ? 'These choices shape your account defaults. You can still change the vibe whenever you ask.'
            : 'Explore the controls in demo mode. Nothing here is sent to Supabase.'}
        </Text>
      </View>

      {user ? (
        <SettingsSection title="PROFILE">
          <Field
            label="DISPLAY NAME"
            onChangeText={(displayName) => setSettings((current) => ({ ...current, displayName }))}
            placeholder="What should we call you?"
            value={settings.displayName}
          />
          <Field
            label="HOME CITY"
            onChangeText={(homeCity) => setSettings((current) => ({ ...current, homeCity }))}
            placeholder="Adelaide"
            value={settings.homeCity}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title="INTERESTS">
        <ChipGroup>
          {visibleInterests.map((interest) => (
            <ContextChip
              key={interest}
              label={interest}
              selected={settings.interests.includes(interest)}
              onPress={() => toggleListValue('interests', interest)}
            />
          ))}
        </ChipGroup>
      </SettingsSection>

      <SettingsSection title="DIETARY PREFERENCES">
        <ChipGroup>
          <ContextChip
            label="No preference"
            selected={settings.dietaryPreferences.length === 0}
            onPress={() => setSettings((current) => ({ ...current, dietaryPreferences: [] }))}
          />
          {visibleDietaryOptions.map((preference) => (
            <ContextChip
              key={preference}
              label={preference}
              selected={settings.dietaryPreferences.includes(preference)}
              onPress={() => toggleListValue('dietaryPreferences', preference)}
            />
          ))}
        </ChipGroup>
      </SettingsSection>

      <SettingsSection title="COMFORTABLE BUDGET">
        <ChipGroup>
          {BUDGETS.map((budget) => (
            <ContextChip
              key={budget}
              accent="warm"
              label={budget}
              selected={settings.budget === budget}
              onPress={() => setSettings((current) => ({ ...current, budget }))}
            />
          ))}
        </ChipGroup>
      </SettingsSection>

      <SettingsSection title="USUALLY WITH">
        <ChipGroup>
          {SOCIAL_OPTIONS.map((socialContext) => (
            <ContextChip
              key={socialContext}
              label={socialContext}
              selected={settings.socialContext === socialContext}
              onPress={() => setSettings((current) => ({ ...current, socialContext }))}
            />
          ))}
        </ChipGroup>
      </SettingsSection>

      <SettingsSection title="DEFAULT DISTANCE">
        <ChipGroup>
          {DISTANCES.map((distanceKm) => (
            <ContextChip
              key={distanceKm}
              label={`${distanceKm} km`}
              selected={settings.distanceKm === distanceKm}
              onPress={() => setSettings((current) => ({ ...current, distanceKm }))}
            />
          ))}
        </ChipGroup>
      </SettingsSection>

      <SettingsSection title="PREFERRED SPONTANEITY">
        <ModeSelector
          value={settings.spontaneityMode}
          onChange={(spontaneityMode) => setSettings((current) => ({ ...current, spontaneityMode }))}
        />
      </SettingsSection>

      <View style={styles.actions}>
        <PrimaryButton
          disabled={loading}
          label="SAVE CHANGES"
          loading={saving}
          onPress={() => void save()}
        />
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.message, messageTone === 'error' && styles.errorMessage]}
          >
            {message}
          </Text>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function ChipGroup({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

function Field({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="words"
        maxLength={80}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.charcoalMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.bodyStrong, color: colors.charcoal },
  spacer: { width: 44, alignItems: 'center' },
  heading: { gap: spacing.sm, marginTop: spacing.xxl },
  title: { ...typography.heading1, color: colors.charcoal },
  copy: { ...typography.body, color: colors.charcoalSoft },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    color: colors.charcoalMuted,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.charcoalSoft, fontSize: 11 },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.charcoal,
  },
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  message: { ...typography.caption, color: colors.positive, textAlign: 'center' },
  errorMessage: { color: colors.danger },
});
