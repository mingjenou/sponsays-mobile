import { useEffect, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/buttons/PrimaryButton';
import { TextButton } from '@/src/components/buttons/TextButton';
import { ContextChip } from '@/src/components/chips/ContextChip';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { BUDGET_OPTIONS, PARTY_SIZE_OPTIONS, WHEN_OPTIONS } from './options';
import type { DiscoveryFilters } from './types';

interface DiscoveryFilterModalProps {
  filters: DiscoveryFilters;
  onApply: (filters: DiscoveryFilters) => void;
  onClose: () => void;
  visible: boolean;
}

export function DiscoveryFilterModal({
  filters,
  onApply,
  onClose,
  visible,
}: DiscoveryFilterModalProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView accessibilityViewIsModal style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR MOMENT</Text>
            <Text style={styles.title}>Filters</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.charcoal} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FilterGroup label="WHEN">
            {WHEN_OPTIONS.map((option) => (
              <ContextChip
                key={option.value}
                label={option.label}
                selected={draft.timePreference === option.value}
                onPress={() => setDraft((current) => ({ ...current, timePreference: option.value }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="BUDGET">
            {BUDGET_OPTIONS.map((option) => (
              <ContextChip
                key={option.value}
                accent="warm"
                label={option.label}
                selected={draft.budget === option.value}
                onPress={() => setDraft((current) => ({ ...current, budget: option.value }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="WHO">
            {PARTY_SIZE_OPTIONS.map((option) => (
              <ContextChip
                key={option.value}
                label={option.label}
                selected={draft.partySize === option.value}
                onPress={() => setDraft((current) => ({ ...current, partySize: option.value }))}
              />
            ))}
          </FilterGroup>
        </ScrollView>

        <View style={styles.actions}>
          <PrimaryButton label="APPLY" onPress={() => onApply(draft)} />
          <TextButton label="Cancel" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FilterGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  eyebrow: { ...typography.caption, color: colors.blueDark, fontSize: 10, letterSpacing: 1.1 },
  title: { ...typography.heading1, color: colors.charcoal },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  content: { gap: spacing.xl, padding: spacing.xl },
  group: { gap: spacing.sm },
  groupLabel: { ...typography.caption, color: colors.charcoalMuted, fontSize: 11, letterSpacing: 1 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actions: { gap: spacing.xs, padding: spacing.xl, paddingTop: spacing.sm },
});
