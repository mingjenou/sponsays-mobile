import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { colors, spacing, typography } from '@/src/theme';

export default function SplashRoute() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(auth)/welcome'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.content}>
        <BrandMark centered showTagline />
        <Text style={styles.tagline}>Stop deciding.{`\n`}Start experiencing.</Text>
      </View>
      <Text style={styles.city}>MADE FOR ADELAIDE · DEMO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  glowTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.blueSoft,
  },
  content: { alignItems: 'center', gap: spacing.xxl, paddingHorizontal: spacing.xl },
  tagline: { ...typography.heading1, color: colors.charcoal, textAlign: 'center' },
  city: {
    ...typography.caption,
    position: 'absolute',
    bottom: spacing.huge,
    color: colors.charcoalMuted,
    letterSpacing: 1.5,
    fontSize: 11,
  },
});
