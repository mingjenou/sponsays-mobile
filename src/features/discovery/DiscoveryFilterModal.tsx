import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { BUDGET_OPTIONS, PARTY_SIZE_OPTIONS } from './options';
import type { DiscoveryFilters } from './types';
import {
  buildLocalDateTimeIso,
  createDateOptions,
  createTimeOptions,
  getLocalDateKey,
  getLocalTimeKey,
  type DiscoveryDateOption,
  type DiscoveryTimeOption,
} from './when';

const DATE_ITEM_WIDTH = 92;
const TIME_ITEM_WIDTH = 92;

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
  const [optionAnchor, setOptionAnchor] = useState(() => new Date());
  const dateOptions = useMemo(() => createDateOptions(optionAnchor), [optionAnchor]);
  const timeOptions = useMemo(() => createTimeOptions(), []);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setOptionAnchor(new Date());
    }
  }, [filters, visible]);

  const selectedDate = new Date(draft.requestedDateTime);
  const selectedDateKey = getLocalDateKey(selectedDate);
  const selectedTimeKey = getLocalTimeKey(selectedDate);

  const selectDate = (dateKey: string) => {
    setDraft((current) => ({
      ...current,
      requestedDateTime: buildLocalDateTimeIso(
        dateKey,
        getLocalTimeKey(new Date(current.requestedDateTime)),
      ),
    }));
  };

  const selectTime = (timeKey: string) => {
    setDraft((current) => ({
      ...current,
      requestedDateTime: buildLocalDateTimeIso(
        getLocalDateKey(new Date(current.requestedDateTime)),
        timeKey,
      ),
    }));
  };

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
          <FilterGroup label="WHEN" stacked>
            <DateSlider
              options={dateOptions}
              selectedDateKey={selectedDateKey}
              onChange={selectDate}
            />
            <TimeSlider
              options={timeOptions}
              selectedTimeKey={selectedTimeKey}
              onChange={selectTime}
            />
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
  stacked = false,
}: {
  children: ReactNode;
  label: string;
  stacked?: boolean;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={[styles.options, stacked && styles.stackedOptions]}>{children}</View>
    </View>
  );
}

function DateSlider({
  options,
  selectedDateKey,
  onChange,
}: {
  options: DiscoveryDateOption[];
  selectedDateKey: string;
  onChange: (dateKey: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.dateKey === selectedDateKey));

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: selectedIndex * DATE_ITEM_WIDTH, animated: false });
  }, [selectedIndex]);

  return (
    <View style={styles.selectorGroup}>
      <Text style={styles.selectorLabel}>Date</Text>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel="Choose a date"
        contentContainerStyle={styles.sliderTrack}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={DATE_ITEM_WIDTH}
      >
        {options.map((option) => {
          const selected = option.dateKey === selectedDateKey;
          return (
            <Pressable
              key={option.dateKey}
              accessibilityRole="button"
              accessibilityLabel={option.accessibilityLabel}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.dateKey)}
              style={({ pressed }) => [
                styles.sliderItem,
                styles.dateItem,
                selected && styles.sliderItemSelected,
                pressed && styles.sliderItemPressed,
              ]}
            >
              <View style={[styles.sliderTick, selected && styles.sliderTickSelected]} />
              <Text style={[styles.sliderText, selected && styles.sliderTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TimeSlider({
  options,
  selectedTimeKey,
  onChange,
}: {
  options: DiscoveryTimeOption[];
  selectedTimeKey: string;
  onChange: (timeKey: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.timeKey === selectedTimeKey));
  const selected = options[selectedIndex] ?? options[0]!;
  const move = (direction: -1 | 1) => {
    const nextIndex = Math.max(0, Math.min(options.length - 1, selectedIndex + direction));
    const next = options[nextIndex];
    if (next) {
      onChange(next.timeKey);
      scrollRef.current?.scrollTo({ x: nextIndex * TIME_ITEM_WIDTH, animated: true });
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: selectedIndex * TIME_ITEM_WIDTH, animated: false });
  }, [selectedIndex]);

  return (
    <View style={styles.selectorGroup}>
      <View style={styles.timeHeader}>
        <Text style={styles.selectorLabel}>Time</Text>
        <View style={styles.timeStepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Earlier by 30 minutes"
            disabled={selectedIndex === 0}
            hitSlop={6}
            onPress={() => move(-1)}
            style={styles.stepButton}
          >
            <Ionicons name="chevron-back" size={18} color={colors.blueDark} />
          </Pressable>
          <View
            accessible
            accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
            accessibilityLabel="Selected time"
            accessibilityRole="adjustable"
            accessibilityValue={{ text: selected.label }}
            onAccessibilityAction={(event) =>
              move(event.nativeEvent.actionName === 'decrement' ? -1 : 1)
            }
            style={styles.selectedTime}
          >
            <Text style={styles.selectedTimeText}>{selected.label}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Later by 30 minutes"
            disabled={selectedIndex === options.length - 1}
            hitSlop={6}
            onPress={() => move(1)}
            style={styles.stepButton}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.blueDark} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel="Choose a time in 30 minute steps"
        contentContainerStyle={styles.sliderTrack}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TIME_ITEM_WIDTH}
      >
        {options.map((option) => {
          const isSelected = option.timeKey === selectedTimeKey;
          return (
            <Pressable
              key={option.timeKey}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(option.timeKey)}
              style={({ pressed }) => [
                styles.sliderItem,
                styles.timeItem,
                isSelected && styles.sliderItemSelected,
                pressed && styles.sliderItemPressed,
              ]}
            >
              <View style={[styles.sliderTick, isSelected && styles.sliderTickSelected]} />
              <Text style={[styles.sliderText, isSelected && styles.sliderTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
  stackedOptions: { flexDirection: 'column', flexWrap: 'nowrap', gap: spacing.md },
  selectorGroup: { gap: spacing.xs },
  selectorLabel: { ...typography.bodyStrong, color: colors.charcoal },
  sliderTrack: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  sliderItem: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dateItem: { width: DATE_ITEM_WIDTH - spacing.xs },
  timeItem: { width: TIME_ITEM_WIDTH - spacing.xs },
  sliderItemSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  sliderItemPressed: { opacity: 0.72 },
  sliderTick: { width: 18, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  sliderTickSelected: { width: 34, backgroundColor: colors.blueDark },
  sliderText: { ...typography.caption, color: colors.charcoalSoft, fontSize: 11 },
  sliderTextSelected: { color: colors.blueDark, fontWeight: '800' },
  timeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
  },
  selectedTime: {
    minWidth: 98,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm,
  },
  selectedTimeText: { ...typography.caption, color: colors.surface },
  actions: { gap: spacing.xs, padding: spacing.xl, paddingTop: spacing.sm },
});
