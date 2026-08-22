import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { TextButton } from '@/src/components/buttons/TextButton';
import { ContextChip } from '@/src/components/chips/ContextChip';
import { ModeSelector } from '@/src/components/chips/ModeSelector';
import { useAuth } from '@/src/features/auth/useAuth';
import { saveMyPreferences } from '@/src/features/profile/preferenceService';
import { completeMyOnboarding } from '@/src/features/profile/profileService';
import type { SpontaneityMode } from '@/src/features/recommendations/engine';
import { colors, spacing, typography } from '@/src/theme';

const INTERESTS = ['Food', 'Coffee', 'Outdoors', 'Culture', 'Activities', 'Hidden gems'];
const SOCIAL_OPTIONS = ['Solo', 'Couple', 'Friends', 'Family'];
const BUDGETS = ['Free', '$', '$$', '$$$', 'Flexible'];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<string[]>(['Outdoors', 'Culture']);
  const [social, setSocial] = useState('Couple');
  const [budget, setBudget] = useState('$$');
  const [mode, setMode] = useState<SpontaneityMode>('spontaneous');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const completeOnboarding = async () => {
    if (!user) {
      router.replace('/(tabs)/do');
      return;
    }

    setSaving(true);
    setSaveError(undefined);
    const [preferencesResult, profileResult] = await Promise.all([
      saveMyPreferences({
        interests,
        dietaryPreferences: [],
        defaultBudget: budget,
        defaultDistanceKm: 5,
        defaultSocialContext: social,
        defaultSpontaneityMode: mode,
      }),
      completeMyOnboarding(),
    ]);
    setSaving(false);

    if (preferencesResult.error || profileResult.error) {
      setSaveError("We couldn't save your profile right now. Try again, or continue without saving.");
      return;
    }

    router.replace('/(tabs)/do');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Text style={styles.step}>A QUICK HELLO</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/do')} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>What usually sounds good?</Text>
          <Text style={styles.copy}>Pick a few. Nothing here is permanent, and SponSays can still surprise you.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>INTERESTS · CHOOSE ANY</Text>
          <View style={styles.chips}>
            {INTERESTS.map((interest) => (
              <ContextChip
                key={interest}
                label={interest}
                selected={interests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>USUALLY WITH</Text>
          <View style={styles.chips}>
            {SOCIAL_OPTIONS.map((option) => (
              <ContextChip key={option} label={option} selected={social === option} onPress={() => setSocial(option)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>COMFORTABLE BUDGET</Text>
          <View style={styles.chips}>
            {BUDGETS.map((option) => (
              <ContextChip
                key={option}
                label={option}
                selected={budget === option}
                onPress={() => setBudget(option)}
                accent="warm"
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PREFERRED SPONTANEITY</Text>
          <ModeSelector value={mode} onChange={setMode} />
          <Text style={styles.modeNote}>
            {mode === 'safe'
              ? 'Closer to what you know.'
              : mode === 'chaos'
                ? 'Push me somewhere different.'
                : 'The sweet spot.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            disabled={saving}
            label="LET'S SPONSAY"
            loading={saving}
            onPress={() => void completeOnboarding()}
          />
          {saveError ? (
            <>
              <Text accessibilityLiveRegion="polite" style={styles.error}>{saveError}</Text>
              <TextButton
                label="Continue without saving"
                onPress={() => router.replace('/(tabs)/do')}
              />
            </>
          ) : (
            <Text style={styles.note}>
              {user ? 'These choices will be saved to your private profile.' : 'Try SponSays without creating an account.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { ...typography.caption, color: colors.blueDark, letterSpacing: 1.3 },
  skip: { ...typography.bodyStrong, color: colors.charcoalSoft },
  heading: { gap: spacing.sm, marginTop: spacing.xxl },
  title: { ...typography.heading1, color: colors.charcoal },
  copy: { ...typography.body, color: colors.charcoalSoft },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  label: { ...typography.caption, color: colors.charcoalMuted, letterSpacing: 0.9, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  modeNote: { ...typography.caption, color: colors.charcoalMuted },
  actions: { gap: spacing.sm, paddingTop: spacing.xxl },
  note: { ...typography.caption, color: colors.charcoalMuted, textAlign: 'center' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
