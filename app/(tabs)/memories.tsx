import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { useAuth } from '@/src/features/auth/useAuth';
import { getMyMemories } from '@/src/features/memories/memoryService';
import type { Memory } from '@/src/features/memories/types';
import { SAMPLE_MEMORIES } from '@/src/mocks/recommendations';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function MemoriesScreen() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        setLoadMessage(undefined);
        return;
      }

      let active = true;
      setLoading(true);
      setLoadMessage(undefined);
      void getMyMemories().then((result) => {
        if (!active) return;
        setLoading(false);
        if (result.error) {
          setLoadMessage(result.error.message);
          return;
        }
        if (result.data) setMemories(result.data);
      });

      return () => {
        active = false;
      };
    }, [user]),
  );

  const visibleMemories: Memory[] = user
    ? memories
    : SAMPLE_MEMORIES.map((memory) => ({
        id: memory.id,
        externalPlaceId: memory.id,
        placeName: memory.name,
        category: memory.category,
        createdAt: memory.date,
        feedback: memory.positive ? 'positive' : null,
      }));

  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.heading}>
        <SectionHeader
          eyebrow="THINGS SPONSAYS GOT YOU TO DO"
          title="Your SponSays"
          description="Good calls you accepted, remembered without turning them into another list to manage."
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryNumber}>{visibleMemories.length} new places tried</Text>
          <Text style={styles.summaryLabel}>A little history of the good calls you accepted.</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.blueDark} />
        ) : (
          <View style={styles.summarySpark}>
            <Text style={styles.summarySparkText}>✦</Text>
          </View>
        )}
      </View>

      {user && !loading && visibleMemories.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="sparkles-outline"
            title="Your first good call will show up here."
            message="Ask SponSays what to do, say I'm in, and we'll remember it for you."
          />
          <PrimaryButton label="BACK TO DO" onPress={() => router.push('/(tabs)/do')} />
        </View>
      ) : (
        <>
          <Text style={styles.month}>{user ? 'RECENT' : 'AUGUST 2026'}</Text>
          <View style={styles.list}>
            {visibleMemories.map((memory, index) => (
              <View key={memory.id} style={styles.memoryCard}>
                <View style={[styles.memoryArt, index % 2 === 1 && styles.memoryArtAlt]}>
                  <Text style={styles.memoryInitial}>{memory.placeName.slice(0, 1)}</Text>
                </View>
                <View style={styles.memoryCopy}>
                  <Text style={styles.memoryName}>{memory.placeName}</Text>
                  <Text style={styles.memoryMeta}>
                    {memory.category ?? 'Experience'} · {formatMemoryDate(memory.createdAt, Boolean(user))}
                  </Text>
                </View>
                <View style={[styles.thumb, memory.feedback === 'negative' && styles.thumbNegative]}>
                  <Text style={styles.thumbText}>
                    {memory.feedback === 'positive' ? '👍' : memory.feedback === 'negative' ? '👎' : '✦'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {loadMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.loadMessage}>{loadMessage}</Text>
      ) : null}

      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.charcoalSoft} />
        <Text style={styles.noteText}>Your memories stay private to you.</Text>
      </View>
    </ScreenContainer>
  );
}

const formatMemoryDate = (value: string, fromDatabase: boolean): string => {
  if (!fromDatabase) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const styles = StyleSheet.create({
  heading: { marginTop: spacing.xxl },
  summary: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.creamDeep, borderRadius: radius.xl, gap: spacing.lg },
  summaryCopy: { flex: 1, gap: spacing.xxs },
  summaryNumber: { ...typography.heading2, color: colors.charcoal },
  summaryLabel: { ...typography.caption, color: colors.charcoalSoft },
  summarySpark: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  summarySparkText: { fontSize: 22, color: colors.surface },
  month: { ...typography.caption, color: colors.charcoalMuted, letterSpacing: 1, fontSize: 11, marginTop: spacing.xxl },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  memoryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  memoryArt: { width: 58, height: 58, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  memoryArtAlt: { backgroundColor: colors.coralSoft },
  memoryInitial: { ...typography.heading2, color: colors.charcoal },
  memoryCopy: { flex: 1, gap: spacing.xxs },
  memoryName: { ...typography.bodyStrong, color: colors.charcoal },
  memoryMeta: { ...typography.caption, color: colors.charcoalMuted },
  thumb: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.positiveSoft, alignItems: 'center', justifyContent: 'center' },
  thumbNegative: { backgroundColor: colors.coralSoft },
  thumbText: { fontSize: 15 },
  emptyWrap: { gap: spacing.lg, marginTop: spacing.xl },
  loadMessage: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.creamDeep },
  noteText: { ...typography.caption, color: colors.charcoalSoft, flex: 1 },
});
