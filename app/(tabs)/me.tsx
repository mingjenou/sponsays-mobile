import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, radius, spacing, typography } from '@/src/theme';

const VIBE = [
  { icon: 'heart-outline' as const, label: 'Interests', value: 'Outdoors, Culture +2' },
  { icon: 'sparkles-outline' as const, label: 'Spontaneity', value: 'Spontaneous' },
  { icon: 'wallet-outline' as const, label: 'Typical budget', value: '$$' },
  { icon: 'navigate-outline' as const, label: 'Travel distance', value: 'Nearby' },
];

const PREFERENCES = [
  { icon: 'restaurant-outline' as const, label: 'Dietary preferences', value: 'Not set' },
  { icon: 'notifications-outline' as const, label: 'Notifications', value: 'Off' },
];

export default function MeScreen() {
  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>Your profile</Text>
          <Text style={styles.location}>Adelaide</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>DEMO</Text>
        </View>
      </View>

      <PreferenceSection title="YOUR VIBE" items={VIBE} />
      <PreferenceSection title="PREFERENCES" items={PREFERENCES} />

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.accountNote}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-outline" size={20} color={colors.blueDark} />
        </View>
        <View style={styles.accountCopyWrap}>
          <Text style={styles.accountTitle}>Try it without an account</Text>
          <Text style={styles.accountCopy}>Your choices stay on this device while you explore SponSays.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

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
});
