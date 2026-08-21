import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/src/theme';

interface BrandMarkProps {
  centered?: boolean;
  compact?: boolean;
  showTagline?: boolean;
}

export function BrandMark({ centered = false, compact = false, showTagline = false }: BrandMarkProps) {
  return (
    <View style={[styles.lockup, centered && styles.centered]} accessibilityLabel="SponSays">
      <View style={styles.row}>
        <View style={[styles.mark, compact && styles.markCompact]}>
          <View style={[styles.coralDash, compact && styles.coralDashCompact]} />
          <View style={[styles.pinHead, compact && styles.pinHeadCompact]}>
            <Text style={[styles.sparkText, compact && styles.sparkTextCompact]}>✦</Text>
          </View>
          <View style={[styles.pinTail, compact && styles.pinTailCompact]} />
        </View>
        <Text style={[styles.wordmark, compact && styles.compact]}>SponSays</Text>
      </View>
      {showTagline ? <Text style={styles.tagline}>SPONTANEOUS PLANS. REAL PLACES.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: 'flex-start', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  centered: { alignItems: 'center' },
  wordmark: { color: colors.charcoal, fontSize: 30, fontWeight: '900', letterSpacing: -1.4 },
  compact: { fontSize: 22, letterSpacing: -0.8 },
  mark: { width: 42, height: 48, alignItems: 'center' },
  markCompact: { width: 31, height: 36 },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    zIndex: 2,
  },
  pinHeadCompact: { width: 29, height: 29 },
  pinTail: {
    position: 'absolute',
    bottom: 3,
    width: 19,
    height: 19,
    borderRadius: 3,
    backgroundColor: colors.blue,
    transform: [{ rotate: '45deg' }],
  },
  pinTailCompact: { width: 14, height: 14, bottom: 2 },
  coralDash: {
    position: 'absolute',
    width: 15,
    height: 6,
    borderRadius: radius.pill,
    left: -5,
    top: 1,
    backgroundColor: colors.coral,
    transform: [{ rotate: '-43deg' }],
    zIndex: 3,
  },
  coralDashCompact: { width: 11, height: 4, left: -3 },
  sparkText: { color: colors.surface, fontSize: 21, fontWeight: '900', zIndex: 4 },
  sparkTextCompact: { fontSize: 15 },
  tagline: { color: colors.blueDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginLeft: 54 },
});
