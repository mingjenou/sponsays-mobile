import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { FeedbackPanel } from '@/src/components/feedback/FeedbackPanel';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { useAuth } from '@/src/features/auth/useAuth';
import { addPlanToCalendar } from '@/src/features/calendar/calendarService';
import { saveRecommendationFeedback } from '@/src/features/feedback/feedbackService';
import { cancelPlanReminder, setPlanReminder } from '@/src/features/notifications/notificationService';
import { openDirections } from '@/src/features/places/placeLinks';
import { getCachedPlannedExperience, getDemoPlannedExperiences, updateDemoPlannedExperience } from '@/src/features/planned/plannedCache';
import { getMyPlannedExperiences, updateMyPlannedExperience } from '@/src/features/planned/plannedService';
import type { PlannedExperience, ReminderOffsetMinutes } from '@/src/features/planned/types';
import { colors, radius, spacing, typography } from '@/src/theme';

const reminderOptions: { label: string; value: ReminderOffsetMinutes }[] = [
  { label: '30 min', value: 30 }, { label: '1 hour', value: 60 }, { label: '2 hours', value: 120 }, { label: '1 day', value: 1440 }, { label: 'Off', value: null },
];

export default function PlannedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlannedExperience | undefined>(() => getCachedPlannedExperience(id));
  const [loading, setLoading] = useState(!plan);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [feedback, setFeedback] = useState<'positive' | 'negative'>();

  useEffect(() => {
    if (plan) return;
    let active = true;
    void (user ? getMyPlannedExperiences() : getDemoPlannedExperiences()).then((result) => {
      if (!active) return;
      setLoading(false);
      setPlan(Array.isArray(result) ? result.find((item) => item.id === id) : result.data?.find((item) => item.id === id));
    });
    return () => { active = false; };
  }, [id, plan, user]);

  const persist = async (updates: Partial<PlannedExperience>) => {
    if (!plan) return undefined;
    let updated: PlannedExperience | undefined;
    if (user) {
      const result = await updateMyPlannedExperience(plan.id, updates);
      updated = result.data ?? undefined;
      if (result.error) setMessage(result.error.message);
    } else {
      updated = await updateDemoPlannedExperience(plan.id, updates);
    }
    if (updated) setPlan(updated);
    else setMessage((current) => current ?? "We couldn't update that right now.");
    return updated;
  };

  if (loading) return <ScreenContainer contentStyle={styles.center}><ActivityIndicator color={colors.blueDark} /></ScreenContainer>;
  if (!plan) return <ScreenContainer contentStyle={styles.center}><EmptyState icon="alert-circle-outline" title="That plan wandered off." message="Return to Planned and try again." /><PrimaryButton label="VIEW PLANNED" onPress={() => router.replace('/planned')} /></ScreenContainer>;

  const handleCalendar = async () => {
    setBusy(true); setMessage(undefined);
    try {
      const result = await addPlanToCalendar(plan);
      if (result.status === 'added') await persist({ calendarEventId: result.eventId });
      if (result.status === 'denied' || result.status === 'unavailable') setMessage(result.message);
    } catch { setMessage("We couldn't add that calendar event right now."); }
    setBusy(false);
  };
  const handleReminder = async (offset: ReminderOffsetMinutes) => {
    setBusy(true); setMessage(undefined);
    try {
      const result = await setPlanReminder(plan, offset);
      if (result.status === 'scheduled') await persist({ notificationId: result.notificationId, reminderOffsetMinutes: offset });
      else if (result.status === 'off') await persist({ notificationId: undefined, reminderOffsetMinutes: null });
      else setMessage(result.message);
    } catch { setMessage("We couldn't update that reminder right now."); }
    setBusy(false);
  };
  const updateStatus = async (status: 'completed' | 'cancelled') => {
    setBusy(true); setMessage(undefined);
    try { await cancelPlanReminder(plan.notificationId); await persist({ status, notificationId: undefined }); }
    catch { setMessage("We couldn't update that plan right now."); }
    setBusy(false);
  };

  const date = new Date(plan.plannedFor);
  return (
    <ScreenContainer>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.charcoal} /></Pressable>
      <Text style={styles.commitment}>{plan.status === 'completed' ? 'YOU DID IT.' : plan.status === 'cancelled' ? 'PLAN CANCELLED' : 'YOU’RE GOING.'}</Text>
      <Text style={styles.title}>{plan.placeName}</Text>
      <Text style={styles.description}>{plan.description}</Text>
      {plan.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(plan.sourceUrl!)}><Text style={styles.link}>Read more</Text></Pressable> : null}
      <View style={styles.details}>
        <Detail icon="calendar-outline" label="DATE + TIME" value={new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(date)} />
        <Detail icon="location-outline" label="LOCATION" value={plan.address ?? 'Location details unavailable'} />
        <Detail icon="pricetag-outline" label="CATEGORY" value={plan.category ?? 'Experience'} />
        <Detail icon="shield-checkmark-outline" label="SOURCE" value={plan.provider === 'google_places' ? 'Google Maps' : 'SponSays demo'} />
      </View>
      {plan.latitude !== undefined && plan.longitude !== undefined ? <PrimaryButton label="GET DIRECTIONS" onPress={() => void openDirections({ latitude: plan.latitude!, longitude: plan.longitude! })} icon={<Ionicons name="navigate" size={18} color={colors.surface} />} /> : null}
      {plan.status === 'planned' ? (
        <>
          <PrimaryButton tone="charcoal" loading={busy} label={plan.calendarEventId ? 'ADDED TO CALENDAR ✓' : 'ADD TO CALENDAR'} onPress={() => void handleCalendar()} />
          <Text style={styles.label}>REMINDER</Text>
          <View style={styles.options}>{reminderOptions.map((option) => <Pressable key={option.label} disabled={busy} onPress={() => void handleReminder(option.value)} style={[styles.option, plan.reminderOffsetMinutes === option.value && styles.optionSelected]}><Text style={[styles.optionText, plan.reminderOffsetMinutes === option.value && styles.optionTextSelected]}>{option.label}</Text></Pressable>)}</View>
          <PrimaryButton loading={busy} label="MARK AS DONE" onPress={() => void updateStatus('completed')} />
          <Pressable disabled={busy} onPress={() => void updateStatus('cancelled')} style={styles.cancel}><Text style={styles.cancelText}>Cancel plan</Text></Pressable>
        </>
      ) : null}
      {plan.status === 'completed' && plan.recommendationId ? <View style={styles.feedback}><FeedbackPanel value={feedback} onChange={(value) => { setFeedback(value); void saveRecommendationFeedback(plan.recommendationId!, value === 'positive'); }} /></View> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      <Pressable onPress={() => router.push('/planned')} style={styles.all}><Text style={styles.link}>View all Planned</Text></Pressable>
    </ScreenContainer>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { return <View style={styles.detail}><Ionicons name={icon} size={22} color={colors.blueDark} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>; }
const styles = StyleSheet.create({
  center: { justifyContent: 'center', gap: spacing.lg }, back: { width: 44, height: 44, justifyContent: 'center' }, commitment: { ...typography.heading2, color: colors.coral, marginTop: spacing.lg, letterSpacing: 0.7 }, title: { ...typography.display, color: colors.charcoal, marginTop: spacing.sm }, description: { ...typography.body, color: colors.charcoalSoft, marginTop: spacing.sm }, link: { ...typography.bodyStrong, color: colors.blueDark, textDecorationLine: 'underline' },
  details: { marginVertical: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, detail: { flexDirection: 'row', gap: spacing.md, minHeight: 74, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, detailCopy: { flex: 1, gap: spacing.xxs }, detailLabel: { ...typography.caption, color: colors.charcoalMuted, fontSize: 10 }, detailValue: { ...typography.bodyStrong, color: colors.charcoal },
  label: { ...typography.caption, color: colors.charcoalMuted, marginTop: spacing.xl, letterSpacing: 1 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm }, option: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, optionSelected: { backgroundColor: colors.blue, borderColor: colors.blue }, optionText: { ...typography.caption, color: colors.charcoal }, optionTextSelected: { color: colors.surface }, cancel: { minHeight: 48, justifyContent: 'center', alignItems: 'center' }, cancelText: { ...typography.bodyStrong, color: colors.danger }, feedback: { marginTop: spacing.xl }, message: { ...typography.caption, color: colors.danger, marginTop: spacing.md }, all: { alignItems: 'center', padding: spacing.lg },
});
