import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { useAuth } from '@/src/features/auth/useAuth';
import { getDemoPlannedExperiences } from '@/src/features/planned/plannedCache';
import { getMyPlannedExperiences } from '@/src/features/planned/plannedService';
import type { PlannedExperience } from '@/src/features/planned/types';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function PlannedScreen() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlannedExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setMessage(undefined);
    void (user ? getMyPlannedExperiences() : getDemoPlannedExperiences()).then((result) => {
      if (!active) return;
      setLoading(false);
      if (Array.isArray(result)) setPlans(result.filter((item) => item.status === 'planned'));
      else if (result.data) setPlans(result.data.filter((item) => item.status === 'planned'));
      else if (result.error) setMessage(result.error.message);
    });
    return () => { active = false; };
  }, [user]));

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BrandMark compact />
        <Pressable accessibilityRole="button" accessibilityLabel="Close Planned" onPress={() => router.back()} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.charcoal} />
        </Pressable>
      </View>
      <Text style={styles.eyebrow}>UPCOMING</Text>
      <Text style={styles.title}>Planned</Text>
      <Text style={styles.copy}>The good calls you’ve committed to, before they become memories.</Text>
      {loading ? <ActivityIndicator color={colors.blueDark} style={styles.loader} /> : plans.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState icon="calendar-outline" title="Nothing planned yet." message="Choose I’M IN on a SponSay and it will land here." />
          <PrimaryButton label="BACK TO DO" onPress={() => router.replace('/(tabs)/do')} />
        </View>
      ) : (
        <View style={styles.list}>
          {plans.map((plan) => (
            <Pressable key={plan.id} accessibilityRole="button" accessibilityLabel={`Open plan for ${plan.placeName}`} onPress={() => router.push(`/planned/${plan.id}`)} style={styles.card}>
              <View style={styles.date}><Text style={styles.day}>{new Date(plan.plannedFor).getDate()}</Text><Text style={styles.month}>{new Intl.DateTimeFormat('en-AU', { month: 'short' }).format(new Date(plan.plannedFor)).toUpperCase()}</Text></View>
              <View style={styles.cardCopy}><Text style={styles.name}>{plan.placeName}</Text><Text style={styles.meta}>{formatPlanDate(plan.plannedFor)} · {plan.category ?? 'Experience'}</Text></View>
              <Ionicons name="chevron-forward" size={20} color={colors.charcoalMuted} />
            </Pressable>
          ))}
        </View>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/memories')} style={styles.memories}><Text style={styles.memoriesText}>View Memories</Text></Pressable>
    </ScreenContainer>
  );
}

const formatPlanDate = (value: string) => new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...typography.caption, color: colors.coral, letterSpacing: 1, marginTop: spacing.xxl }, title: { ...typography.display, color: colors.charcoal, marginTop: spacing.xs }, copy: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.xs },
  loader: { marginTop: spacing.xxl }, empty: { marginTop: spacing.xl, gap: spacing.lg }, list: { gap: spacing.sm, marginTop: spacing.xl },
  card: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  date: { width: 50, height: 54, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }, day: { ...typography.heading2, color: colors.blueDark }, month: { ...typography.caption, fontSize: 9, color: colors.blueDark },
  cardCopy: { flex: 1, gap: spacing.xxs }, name: { ...typography.bodyStrong, color: colors.charcoal }, meta: { ...typography.caption, color: colors.charcoalMuted },
  message: { ...typography.caption, color: colors.danger, marginTop: spacing.md }, memories: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl }, memoriesText: { ...typography.bodyStrong, color: colors.blueDark },
});
