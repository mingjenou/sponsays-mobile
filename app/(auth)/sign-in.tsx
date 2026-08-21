import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { TextButton } from '@/src/components/buttons/TextButton';
import { BrandMark } from '@/src/components/typography/BrandMark';
import { useAuth } from '@/src/features/auth/useAuth';
import { colors, radius, spacing, typography } from '@/src/theme';

type PendingAction = 'sign-in' | 'sign-up' | null;

export default function SignInScreen() {
  const { isConfigured, loading: authLoading, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const submit = async (action: Exclude<PendingAction, null>) => {
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (!email.trim().includes('@') || password.length < 6) {
      setErrorMessage('Enter a valid email and a password of at least 6 characters.');
      return;
    }

    setPendingAction(action);
    const result =
      action === 'sign-in'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
    setPendingAction(null);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    if (action === 'sign-up' && !result.session) {
      setPassword('');
      setSuccessMessage('Check your email to finish creating your account.');
      return;
    }

    router.replace('/(tabs)/do');
  };

  const formDisabled = !isConfigured || authLoading || pendingAction !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
            </Pressable>
            <BrandMark compact />
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.title}>Pick up where you left off.</Text>
            <Text style={styles.copy}>Sign in, create an account, or keep exploring in demo mode.</Text>
          </View>

          {!isConfigured ? (
            <View style={styles.demoNotice} accessibilityLiveRegion="polite">
              <Ionicons name="information-circle-outline" size={21} color={colors.blueDark} />
              <Text style={styles.demoNoticeText}>
                Account sign-in isn&apos;t available in this demo yet. You can keep using SponSays below.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                editable={!formDisabled}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.charcoalMuted}
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="password"
                editable={!formDisabled}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.charcoalMuted}
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
              />
            </View>

            {errorMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            {successMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.successText}>{successMessage}</Text>
            ) : null}

            <View style={styles.actions}>
              <PrimaryButton
                disabled={formDisabled}
                label="SIGN IN"
                loading={pendingAction === 'sign-in'}
                onPress={() => void submit('sign-in')}
              />
              <TextButton
                disabled={formDisabled}
                label="Create account"
                onPress={() => void submit('sign-up')}
              />
            </View>
          </View>

          <View style={styles.demoAction}>
            <Text style={styles.demoActionTitle}>Not ready for an account?</Text>
            <Text style={styles.demoActionCopy}>The full Adelaide demo still works without signing in.</Text>
            <TextButton label="Continue in demo mode" onPress={() => router.replace('/(tabs)/do')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  keyboardView: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  heading: { gap: spacing.sm, marginTop: spacing.xxl },
  eyebrow: { ...typography.caption, color: colors.blueDark, letterSpacing: 1.2 },
  title: { ...typography.heading1, color: colors.charcoal },
  copy: { ...typography.body, color: colors.charcoalSoft },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.blueSoft,
  },
  demoNoticeText: { ...typography.caption, color: colors.charcoalSoft, flex: 1 },
  form: { gap: spacing.md, marginTop: spacing.xl },
  field: { gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.charcoal },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.charcoal,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.danger },
  successText: { ...typography.caption, color: colors.positive },
  actions: { gap: spacing.xs, marginTop: spacing.xs },
  demoAction: {
    gap: spacing.xxs,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
  },
  demoActionTitle: { ...typography.bodyStrong, color: colors.charcoal, textAlign: 'center' },
  demoActionCopy: { ...typography.caption, color: colors.charcoalSoft, textAlign: 'center' },
});
