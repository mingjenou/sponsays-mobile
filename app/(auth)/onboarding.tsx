import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { ContextChip } from '@/src/components/chips/ContextChip';
import { colors, spacing, typography } from '@/src/theme';

const INTERESTS = ['Food', 'Coffee', 'Outdoors', 'Culture', 'Activities', 'Hidden gems'];
const SOCIAL_OPTIONS = ['Solo', 'Couple', 'Friends', 'Family'];
const BUDGETS = ['Free', '$', '$$', '$$$', 'Flexible'];

export default function OnboardingScreen() {
  const [interests, setInterests] = useState<string[]>(['Outdoors', 'Culture']);
  const [social, setSocial] = useState('Couple');
  const [budget, setBudget] = useState('$$');

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.step}>A QUICK HELLO</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/do')} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>What usually sounds good?</Text>
          <Text style={styles.copy}>Pick a few. Nothing here is permanent, and SponSays can still surprise you.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>INTERESTS · CHOOSE ANY</Text>
          <View style={styles.chips}>
            {INTERESTS.map((interest) => (
              <ContextChip
                key={interest}
                label={interest}
                selected={interests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>USUALLY WITH</Text>
          <View style={styles.chips}>
            {SOCIAL_OPTIONS.map((option) => (
              <ContextChip key={option} label={option} selected={social === option} onPress={() => setSocial(option)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>COMFORTABLE BUDGET</Text>
          <View style={styles.chips}>
            {BUDGETS.map((option) => (
              <ContextChip
                key={option}
                label={option}
                selected={budget === option}
                onPress={() => setBudget(option)}
                accent="yellow"
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="LET'S SPONSAY" onPress={() => router.replace('/(tabs)/do')} />
          <Text style={styles.note}>Demo preferences are temporary and require no account.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1, padding: spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { ...typography.caption, color: colors.turquoise, letterSpacing: 1.3 },
  skip: { ...typography.bodyStrong, color: colors.charcoalSoft },
  heading: { gap: spacing.sm, marginTop: spacing.xxl },
  title: { ...typography.heading1, color: colors.charcoal },
  copy: { ...typography.body, color: colors.charcoalSoft },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  label: { ...typography.caption, color: colors.charcoalMuted, letterSpacing: 0.9, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actions: { marginTop: 'auto', gap: spacing.sm, paddingTop: spacing.xl },
  note: { ...typography.caption, color: colors.charcoalMuted, textAlign: 'center' },
});
