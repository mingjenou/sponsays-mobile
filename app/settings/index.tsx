import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/layout/ScreenContainer';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.card}>
        <View style={styles.iconCircle}><Ionicons name="construct-outline" size={28} color={colors.blueDark} /></View>
        <Text style={styles.title}>More preferences are coming soon.</Text>
        <Text style={styles.copy}>For now, keep making good calls with the choices already on your profile.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.bodyStrong, color: colors.charcoal },
  spacer: { width: 44 },
  card: { marginTop: spacing.xxl, padding: spacing.xxl, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.heading2, color: colors.charcoal, textAlign: 'center' },
  copy: { ...typography.body, color: colors.charcoalSoft, textAlign: 'center' },
});
