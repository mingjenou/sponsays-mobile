import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  createDateOptions,
  createTimeOptions,
  ensureRequestedDateTimeIsFuture,
  getLocalDateKey,
  getLocalTimeKey,
  getNearestFutureHalfHour,
  isLocalDateTimeBeforeNextSlot,
  replaceRequestedDate,
  replaceRequestedTime,
  type DiscoveryDateOption,
  type DiscoveryTimeOption,
} from './when';

const WHEEL_ROW_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;
const WHEEL_VERTICAL_PADDING = WHEEL_ROW_HEIGHT * 2;

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
      const now = new Date();
      setDraft({
        ...filters,
        requestedDateTime: ensureRequestedDateTimeIsFuture(filters.requestedDateTime, now),
      });
      setOptionAnchor(now);
    }
  }, [filters, visible]);

  const selectedDate = new Date(draft.requestedDateTime);
  const selectedDateKey = getLocalDateKey(selectedDate);
  const selectedTimeKey = getLocalTimeKey(selectedDate);
  const earliestDateKey = getLocalDateKey(getNearestFutureHalfHour(optionAnchor));
  const disabledDateKeys = useMemo(
    () => new Set(
      dateOptions
        .filter((option) => option.dateKey < earliestDateKey)
        .map((option) => option.dateKey),
    ),
    [dateOptions, earliestDateKey],
  );
  const disabledTimeKeys = useMemo(
    () => new Set(
      timeOptions
        .filter((option) =>
          isLocalDateTimeBeforeNextSlot(selectedDateKey, option.timeKey, optionAnchor))
        .map((option) => option.timeKey),
    ),
    [optionAnchor, selectedDateKey, timeOptions],
  );

  const selectDate = (dateKey: string) => {
    setDraft((current) => ({
      ...current,
      requestedDateTime: replaceRequestedDate(current.requestedDateTime, dateKey),
    }));
  };

  const selectTime = (timeKey: string) => {
    setDraft((current) => ({
      ...current,
      requestedDateTime: replaceRequestedTime(current.requestedDateTime, timeKey),
    }));
  };

  const applyDraft = () => onApply({
    ...draft,
    requestedDateTime: ensureRequestedDateTimeIsFuture(draft.requestedDateTime),
  });

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
            <PairedWhenWheel
              dateOptions={dateOptions}
              disabledDateKeys={disabledDateKeys}
              disabledTimeKeys={disabledTimeKeys}
              onDateChange={selectDate}
              onTimeChange={selectTime}
              selectedDateKey={selectedDateKey}
              selectedTimeKey={selectedTimeKey}
              timeOptions={timeOptions}
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
          <PrimaryButton label="APPLY" onPress={applyDraft} />
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

interface WheelOption {
  key: string;
  label: string;
  accessibilityLabel: string;
}

function PairedWhenWheel({
  dateOptions,
  disabledDateKeys,
  disabledTimeKeys,
  onDateChange,
  onTimeChange,
  selectedDateKey,
  selectedTimeKey,
  timeOptions,
}: {
  dateOptions: DiscoveryDateOption[];
  disabledDateKeys: Set<string>;
  disabledTimeKeys: Set<string>;
  onDateChange: (dateKey: string) => void;
  onTimeChange: (timeKey: string) => void;
  selectedDateKey: string;
  selectedTimeKey: string;
  timeOptions: DiscoveryTimeOption[];
}) {
  const dates: WheelOption[] = dateOptions.map((option) => ({
    key: option.dateKey,
    label: option.label,
    accessibilityLabel: option.accessibilityLabel,
  }));
  const times: WheelOption[] = timeOptions.map((option) => ({
    key: option.timeKey,
    label: option.label,
    accessibilityLabel: option.label,
  }));

  return (
    <View style={styles.whenPicker}>
      <View style={styles.wheelHeaders}>
        <Text style={styles.wheelHeader}>DATE</Text>
        <Text style={styles.wheelHeader}>TIME</Text>
      </View>
      <View style={styles.wheelViewport}>
        <View pointerEvents="none" style={styles.selectionRegion} />
        <WheelColumn
          accessibilityLabel="Date"
          disabledKeys={disabledDateKeys}
          onChange={onDateChange}
          options={dates}
          selectedKey={selectedDateKey}
        />
        <View pointerEvents="none" style={styles.wheelDivider} />
        <WheelColumn
          accessibilityLabel="Time"
          disabledKeys={disabledTimeKeys}
          onChange={onTimeChange}
          options={times}
          selectedKey={selectedTimeKey}
        />
      </View>
    </View>
  );
}

function WheelColumn({
  accessibilityLabel,
  disabledKeys,
  onChange,
  options,
  selectedKey,
}: {
  accessibilityLabel: 'Date' | 'Time';
  disabledKeys: Set<string>;
  onChange: (key: string) => void;
  options: WheelOption[];
  selectedKey: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.key === selectedKey));
  const selected = options[selectedIndex] ?? options[0]!;

  const scrollToIndex = (index: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ y: index * WHEEL_ROW_HEIGHT, animated });
  };

  const selectIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(options.length - 1, index));
    const option = options[boundedIndex];
    if (!option || disabledKeys.has(option.key)) {
      scrollToIndex(selectedIndex, true);
      return;
    }
    onChange(option.key);
    scrollToIndex(boundedIndex, true);
  };

  const move = (direction: -1 | 1) => {
    let nextIndex = selectedIndex + direction;
    while (nextIndex >= 0 && nextIndex < options.length) {
      const option = options[nextIndex];
      if (option && !disabledKeys.has(option.key)) {
        selectIndex(nextIndex);
        return;
      }
      nextIndex += direction;
    }
  };

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex]);

  const settleSelection = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    selectIndex(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT));
  };

  return (
    <View
      accessible
      accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ text: selected.accessibilityLabel }}
      onAccessibilityAction={(event) =>
        move(event.nativeEvent.actionName === 'decrement' ? -1 : 1)
      }
      style={styles.wheelColumn}
    >
      <ScrollView
        ref={scrollRef}
        accessibilityElementsHidden
        contentContainerStyle={styles.wheelContent}
        decelerationRate="fast"
        importantForAccessibility="no-hide-descendants"
        nestedScrollEnabled
        onContentSizeChange={() => scrollToIndex(selectedIndex, false)}
        onMomentumScrollEnd={settleSelection}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW_HEIGHT}
      >
        {options.map((option, index) => {
          const distance = Math.abs(index - selectedIndex);
          const disabled = disabledKeys.has(option.key);
          const opacity = disabled ? 0.1 : distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.22 : 0.08;
          return (
            <Pressable
              key={option.key}
              accessible={false}
              disabled={disabled}
              onPress={() => selectIndex(index)}
              style={({ pressed }) => [
                styles.wheelRow,
                { opacity },
                pressed && styles.wheelRowPressed,
              ]}
            >
              <Text style={[styles.wheelText, distance === 0 && styles.wheelTextSelected]}>
                {option.label}
              </Text>
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
  whenPicker: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
  },
  wheelHeaders: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  wheelHeader: {
    ...typography.caption,
    flex: 1,
    color: colors.charcoalMuted,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  wheelViewport: {
    height: WHEEL_HEIGHT,
    flexDirection: 'row',
    position: 'relative',
  },
  selectionRegion: {
    position: 'absolute',
    top: WHEEL_VERTICAL_PADDING,
    left: spacing.xs,
    right: spacing.xs,
    height: WHEEL_ROW_HEIGHT,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
  },
  wheelColumn: { flex: 1, height: WHEEL_HEIGHT },
  wheelContent: { paddingVertical: WHEEL_VERTICAL_PADDING },
  wheelDivider: {
    width: 1,
    height: WHEEL_ROW_HEIGHT - spacing.xs,
    position: 'absolute',
    zIndex: 1,
    top: WHEEL_VERTICAL_PADDING + spacing.xxs,
    left: '50%',
    backgroundColor: colors.blue,
    opacity: 0.35,
  },
  wheelRow: {
    height: WHEEL_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  wheelRowPressed: { opacity: 0.65 },
  wheelText: { ...typography.caption, color: colors.charcoal, fontSize: 12, textAlign: 'center' },
  wheelTextSelected: { color: colors.blueDark, fontWeight: '800' },
  actions: { gap: spacing.xs, padding: spacing.xl, paddingTop: spacing.sm },
});
