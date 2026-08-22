import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { TextButton } from '@/src/components/buttons/TextButton';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { useAuth } from '@/src/features/auth/useAuth';
import { getMyPreferences } from '@/src/features/profile/preferenceService';
import { getMyProfile } from '@/src/features/profile/profileService';
import type { Profile, UserPreferences } from '@/src/features/profile/types';
import { colors, radius, spacing, typography } from '@/src/theme';

const VIBE = [
  { icon: 'heart-outline' as const, label: 'Interests', value: 'Outdoors, Culture +2' },
  { icon: 'wallet-outline' as const, label: 'Typical budget', value: '$$' },
  { icon: 'navigate-outline' as const, label: 'Travel distance', value: 'Nearby' },
];

const PREFERENCES = [
  { icon: 'restaurant-outline' as const, label: 'Dietary preferences', value: 'Not set' },
  { icon: 'notifications-outline' as const, label: 'Notifications', value: 'Off' },
];

export default function MeScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>();
  const [preferences, setPreferences] = useState<UserPreferences>();
  const [loading, setLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string>();
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setProfile(undefined);
        setPreferences(undefined);
        setLoading(false);
        setAccountMessage(undefined);
        return;
      }

      let active = true;
      setLoading(true);
      setAccountMessage(undefined);
      void Promise.all([getMyProfile(), getMyPreferences()]).then(([profileResult, preferenceResult]) => {
        if (!active) return;
        setLoading(false);
        if (profileResult.data) setProfile(profileResult.data);
        if (preferenceResult.data) setPreferences(preferenceResult.data);
        if (profileResult.error || preferenceResult.error) {
          setAccountMessage("We couldn't refresh all of your profile right now.");
        }
      });

      return () => {
        active = false;
      };
    }, [user]),
  );

  const authenticatedVibe = useMemo(
    () => [
      {
        icon: 'heart-outline' as const,
        label: 'Interests',
        value: formatList(preferences?.interests),
      },
      {
        icon: 'wallet-outline' as const,
        label: 'Typical budget',
        value: preferences?.default_budget ?? 'Not set',
      },
      {
        icon: 'navigate-outline' as const,
        label: 'Travel distance',
        value: preferences?.default_distance_km === null || preferences?.default_distance_km === undefined
          ? 'Not set'
          : `${preferences.default_distance_km} km`,
      },
    ],
    [preferences],
  );

  const authenticatedPreferences = useMemo(
    () => [
      {
        icon: 'restaurant-outline' as const,
        label: 'Dietary preferences',
        value: formatList(preferences?.dietary_preferences),
      },
      {
        icon: 'people-outline' as const,
        label: 'Usually with',
        value: preferences?.default_social_context ?? 'Not set',
      },
    ],
    [preferences],
  );

  const displayName = user
    ? profile?.display_name?.trim() || user.email?.split('@')[0] || 'Your account'
    : 'Your profile';
  const homeCity = user ? profile?.home_city?.trim() || 'Home city not set' : 'Adelaide';
  const vibe = user ? authenticatedVibe : VIBE;
  const preferenceItems = user ? authenticatedPreferences : PREFERENCES;

  const handleSignOut = async () => {
    setSigningOut(true);
    setAccountMessage(undefined);
    const result = await signOut();
    setSigningOut(false);
    if (result.error) {
      setAccountMessage(result.error.message);
      return;
    }
    router.replace('/(auth)/welcome');
  };

  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.location}>{homeCity}</Text>
        </View>
        <View style={styles.statusPill}>
          {loading ? (
            <ActivityIndicator color={colors.blueDark} size="small" />
          ) : (
            <Text style={styles.statusText}>{user ? 'SIGNED IN' : 'DEMO'}</Text>
          )}
        </View>
      </View>

      <PreferenceSection title="YOUR VIBE" items={vibe} />
      <PreferenceSection title="PREFERENCES" items={preferenceItems} />

      <Pressable accessibilityRole="button" accessibilityLabel="View Planned experiences" onPress={() => router.push('/planned')} style={styles.plannedCard}>
        <View style={styles.iconCircle}><Ionicons name="calendar-outline" size={20} color={colors.blueDark} /></View>
        <View style={styles.preferenceCopy}><Text style={styles.preferenceLabel}>Planned</Text><Text style={styles.preferenceValue}>Upcoming SponSays</Text></View>
        <Ionicons name="chevron-forward" size={19} color={colors.charcoalMuted} />
      </Pressable>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.accountNote}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-outline" size={20} color={colors.blueDark} />
        </View>
        <View style={styles.accountCopyWrap}>
          <Text style={styles.accountTitle}>{user ? 'Signed in securely' : 'Try it without an account'}</Text>
          <Text style={styles.accountCopy}>
            {user
              ? 'Your profile and accepted SponSays stay private to this account.'
              : 'Your choices stay on this device while you explore SponSays.'}
          </Text>
          {user ? (
            <TextButton
              disabled={signingOut}
              label={signingOut ? 'Signing out…' : 'Sign Out'}
              onPress={() => void handleSignOut()}
            />
          ) : null}
        </View>
      </View>
      {accountMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.accountMessage}>{accountMessage}</Text>
      ) : null}
    </ScreenContainer>
  );
}

const formatList = (values?: string[] | null): string => {
  if (!values || values.length === 0) return 'Not set';
  if (values.length <= 2) return values.join(', ');
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
};

function PreferenceSection({
  title,
  items,
}: {
  title: string;
  items: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[];
}) {
  return (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.preferenceCard}>
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${item.value}`}
            onPress={() => router.push('/settings')}
            style={[styles.preferenceRow, index > 0 && styles.withBorder]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={20} color={colors.blueDark} />
            </View>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceLabel}>{item.label}</Text>
              <Text style={styles.preferenceValue} numberOfLines={1}>{item.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.charcoalMuted} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  plannedCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.creamDeep, borderRadius: radius.xl, marginBottom: spacing.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading2, color: colors.surface },
  profileCopy: { flex: 1, gap: spacing.xxs },
  name: { ...typography.heading2, color: colors.charcoal },
  location: { ...typography.caption, color: colors.charcoalMuted, fontSize: 11 },
  statusPill: {
    backgroundColor: colors.blueSoft,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statusText: { ...typography.caption, color: colors.blueDark, fontSize: 9, letterSpacing: 0.7 },
  sectionLabel: {
    ...typography.caption,
    color: colors.charcoalMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  preferenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  preferenceRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  withBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceCopy: { flex: 1 },
  preferenceLabel: { ...typography.bodyStrong, color: colors.charcoal },
  preferenceValue: { ...typography.caption, color: colors.charcoalMuted },
  accountNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.xl,
  },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCopyWrap: { flex: 1, gap: spacing.xxs },
  accountTitle: { ...typography.bodyStrong, color: colors.charcoal },
  accountCopy: { ...typography.caption, color: colors.charcoalSoft },
  accountMessage: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
