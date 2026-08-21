import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, radius, spacing, typography } from '@/src/theme';

const PREFERENCES = [
  { icon: 'heart-outline' as const, label: 'Interests', value: 'Outdoors, Culture +2' },
  { icon: 'restaurant-outline' as const, label: 'Dietary preferences', value: 'Not set' },
  { icon: 'wallet-outline' as const, label: 'Default budget', value: '$$' },
  { icon: 'navigate-outline' as const, label: 'Travel distance', value: 'Nearby' },
];

export default function MeScreen() {
  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>Demo explorer</Text>
          <Text style={styles.location}>Adelaide · Demo preferences</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>DEMO</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>MY DEFAULTS</Text>
      <View style={styles.preferenceCard}>
        {PREFERENCES.map((preference, index) => (
          <Pressable
            key={preference.label}
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={[styles.preferenceRow, index > 0 && styles.withBorder]}
          >
            <View style={styles.iconCircle}><Ionicons name={preference.icon} size={20} color={colors.blueDark} /></View>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceLabel}>{preference.label}</Text>
              <Text style={styles.preferenceValue} numberOfLines={1}>{preference.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.charcoalMuted} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>APP</Text>
      <View style={styles.preferenceCard}>
        <MenuRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings')} />
        <MenuRow icon="shield-checkmark-outline" label="Privacy" onPress={() => router.push('/settings')} border />
        <MenuRow icon="information-circle-outline" label="About SponSays" onPress={() => router.push('/settings')} border />
      </View>

      <View style={styles.accountNote}>
        <Text style={styles.accountTitle}>No account needed</Text>
        <Text style={styles.accountCopy}>This Expo Go prototype keeps preferences on the device for the current demo only.</Text>
      </View>
    </ScreenContainer>
  );
}

function MenuRow({ icon, label, onPress, border = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; border?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.preferenceRow, border && styles.withBorder]}>
      <View style={styles.iconCircle}><Ionicons name={icon} size={20} color={colors.charcoalSoft} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={19} color={colors.charcoalMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.xxl },
  avatar: { width: 62, height: 62, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.heading2, color: colors.charcoal },
  profileCopy: { flex: 1, gap: spacing.xxs },
  name: { ...typography.heading2, color: colors.charcoal },
  location: { ...typography.caption, color: colors.charcoalMuted },
  statusPill: { backgroundColor: colors.blueSoft, borderRadius: radius.pill, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  statusText: { ...typography.caption, color: colors.blueDark, fontSize: 9, letterSpacing: 0.7 },
  sectionLabel: { ...typography.caption, color: colors.charcoalMuted, fontSize: 11, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  preferenceCard: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  preferenceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  withBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  iconCircle: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  preferenceCopy: { flex: 1 },
  preferenceLabel: { ...typography.bodyStrong, color: colors.charcoal },
  preferenceValue: { ...typography.caption, color: colors.charcoalMuted },
  menuLabel: { ...typography.bodyStrong, color: colors.charcoal, flex: 1 },
  accountNote: { padding: spacing.lg, backgroundColor: colors.blueSoft, borderRadius: radius.xl, gap: spacing.sm },
  accountTitle: { ...typography.bodyStrong, color: colors.charcoal },
  accountCopy: { ...typography.caption, color: colors.charcoalSoft },
});
