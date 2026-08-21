import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { SAMPLE_MEMORIES } from '@/src/mocks/recommendations';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function MemoriesScreen() {
  return (
    <ScreenContainer>
      <BrandMark compact />
      <View style={styles.heading}>
        <SectionHeader
          eyebrow="YOUR SPONSAYS"
          title="Good calls, kept simple."
          description="Things you chose to do — not places you spent an hour comparing."
        />
      </View>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryNumber}>{SAMPLE_MEMORIES.length}</Text>
          <Text style={styles.summaryLabel}>demo memories</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View>
          <Text style={styles.summaryNumber}>100%</Text>
          <Text style={styles.summaryLabel}>good calls</Text>
        </View>
        <View style={styles.summarySpark}>
          <Text style={styles.summarySparkText}>✦</Text>
        </View>
      </View>

      <Text style={styles.month}>AUGUST 2026</Text>
      <View style={styles.list}>
        {SAMPLE_MEMORIES.map((memory, index) => (
          <View key={memory.id} style={styles.memoryCard}>
            <View style={[styles.memoryArt, index === 1 && styles.memoryArtAlt]}>
              <Text style={styles.memoryInitial}>{memory.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.memoryCopy}>
              <Text style={styles.memoryName}>{memory.name}</Text>
              <Text style={styles.memoryMeta}>{memory.category} · {memory.date}</Text>
            </View>
            <View style={styles.thumb}>
              <Text style={styles.thumbText}>👍</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.charcoalSoft} />
        <Text style={styles.noteText}>Memories are private in this MVP. No feed, followers or public profile.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: spacing.xxl },
  summary: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.yellowSoft, borderRadius: radius.xl, gap: spacing.lg },
  summaryNumber: { ...typography.heading2, color: colors.charcoal },
  summaryLabel: { ...typography.caption, color: colors.charcoalSoft },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  summarySpark: { marginLeft: 'auto', width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  summarySparkText: { fontSize: 22, color: colors.charcoal },
  month: { ...typography.caption, color: colors.charcoalMuted, letterSpacing: 1, fontSize: 11, marginTop: spacing.xxl },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  memoryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  memoryArt: { width: 58, height: 58, borderRadius: radius.md, backgroundColor: colors.turquoiseSoft, alignItems: 'center', justifyContent: 'center' },
  memoryArtAlt: { backgroundColor: colors.coralSoft },
  memoryInitial: { ...typography.heading2, color: colors.charcoal },
  memoryCopy: { flex: 1, gap: spacing.xxs },
  memoryName: { ...typography.bodyStrong, color: colors.charcoal },
  memoryMeta: { ...typography.caption, color: colors.charcoalMuted },
  thumb: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.positiveSoft, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 15 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.creamDeep },
  noteText: { ...typography.caption, color: colors.charcoalSoft, flex: 1 },
});
