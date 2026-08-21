import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { TextButton } from '@/src/components/buttons/TextButton';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, radius, spacing, typography } from '@/src/theme';

const PROMISES = [
  { icon: 'options-outline' as const, text: 'Tell us a little about the moment.' },
  { icon: 'sparkles-outline' as const, text: 'Get one genuinely useful recommendation.' },
  { icon: 'walk-outline' as const, text: 'Stop browsing and go do it.' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BrandMark />
        <View style={styles.hero}>
          <View style={styles.sparkCircle}>
            <Text style={styles.spark}>✦</Text>
          </View>
          <Text style={styles.title}>Stop deciding.{`\n`}Start experiencing.</Text>
          <Text style={styles.copy}>Tell SponSays a little about the moment. We&apos;ll make the call.</Text>
        </View>

        <View style={styles.promises}>
          {PROMISES.map((item) => (
            <View key={item.text} style={styles.promiseRow}>
              <View style={styles.promiseIcon}>
                <Ionicons name={item.icon} size={19} color={colors.blueDark} />
              </View>
              <Text style={styles.promiseText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="SHOW ME HOW" onPress={() => router.push('/(auth)/onboarding')} />
          <TextButton label="Skip and try the demo" onPress={() => router.replace('/(tabs)/do')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1, padding: spacing.xl, paddingTop: spacing.lg },
  hero: { alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.huge },
  sparkCircle: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: { fontSize: 28, color: colors.surface },
  title: { ...typography.display, color: colors.charcoal },
  copy: { ...typography.body, color: colors.charcoalSoft, maxWidth: 340 },
  promises: { gap: spacing.sm, marginTop: spacing.xxl },
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promiseIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  promiseText: { ...typography.caption, color: colors.charcoalSoft, flex: 1 },
  actions: { marginTop: 'auto', gap: spacing.xs },
});
