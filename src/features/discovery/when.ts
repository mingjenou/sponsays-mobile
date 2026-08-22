export const DATE_OPTION_COUNT = 14;
export const TIME_INTERVAL_MINUTES = 30;
export const FIRST_TIME_MINUTES = 6 * 60;
export const LAST_TIME_MINUTES = 23 * 60 + 30;

export interface DiscoveryDateOption {
  dateKey: string;
  label: string;
  accessibilityLabel: string;
}

export interface DiscoveryTimeOption {
  timeKey: string;
  label: string;
  minutesSinceMidnight: number;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export const getLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getLocalTimeKey = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const buildLocalDateTimeIso = (dateKey: string, timeKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeKey.split(':').map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) {
    throw new Error('Invalid local date or time selection.');
  }
  const localDate = new Date(year!, month! - 1, day!, hours!, minutes!, 0, 0);
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month! - 1 ||
    localDate.getDate() !== day ||
    localDate.getHours() !== hours ||
    localDate.getMinutes() !== minutes
  ) {
    throw new Error('Invalid local date or time selection.');
  }
  return localDate.toISOString();
};

export const getNearestFutureHalfHour = (now: Date = new Date()): Date => {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const remainder = minutes % TIME_INTERVAL_MINUTES;
  if (remainder > 0 || now.getSeconds() > 0 || now.getMilliseconds() > 0) {
    next.setMinutes(minutes + (TIME_INTERVAL_MINUTES - remainder));
  }

  const minutesSinceMidnight = next.getHours() * 60 + next.getMinutes();
  if (minutesSinceMidnight < FIRST_TIME_MINUTES) next.setHours(6, 0, 0, 0);
  if (minutesSinceMidnight > LAST_TIME_MINUTES) {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  }
  return next;
};

export const createDefaultRequestedDateTime = (now: Date = new Date()): string =>
  getNearestFutureHalfHour(now).toISOString();

export const ensureRequestedDateTimeIsFuture = (
  requestedDateTime: string,
  now: Date = new Date(),
): string => {
  const selected = new Date(requestedDateTime);
  const earliest = getNearestFutureHalfHour(now);
  return selected.getTime() < earliest.getTime()
    ? earliest.toISOString()
    : selected.toISOString();
};

export const replaceRequestedDate = (
  requestedDateTime: string,
  dateKey: string,
  now: Date = new Date(),
): string => ensureRequestedDateTimeIsFuture(
  buildLocalDateTimeIso(dateKey, getLocalTimeKey(new Date(requestedDateTime))),
  now,
);

export const replaceRequestedTime = (
  requestedDateTime: string,
  timeKey: string,
  now: Date = new Date(),
): string => ensureRequestedDateTimeIsFuture(
  buildLocalDateTimeIso(getLocalDateKey(new Date(requestedDateTime)), timeKey),
  now,
);

export const isLocalDateTimeBeforeNextSlot = (
  dateKey: string,
  timeKey: string,
  now: Date = new Date(),
): boolean => new Date(buildLocalDateTimeIso(dateKey, timeKey)).getTime() <
  getNearestFutureHalfHour(now).getTime();

export const createDateOptions = (now: Date = new Date()): DiscoveryDateOption[] => {
  const todayKey = getLocalDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = getLocalDateKey(tomorrow);

  return Array.from({ length: DATE_OPTION_COUNT }, (_unused, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index, 12);
    const dateKey = getLocalDateKey(date);
    const dayMonth = new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
    }).format(date);
    const weekday = new Intl.DateTimeFormat('en-AU', {
      weekday: 'short',
    }).format(date);
    const full = new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
    return {
      dateKey,
      label: dateKey === todayKey
        ? `Today ${dayMonth}`
        : dateKey === tomorrowKey
          ? `Tomorrow ${dayMonth}`
          : `${weekday} ${dayMonth}`,
      accessibilityLabel: dateKey === todayKey ? `Today, ${full}` : dateKey === tomorrowKey ? `Tomorrow, ${full}` : full,
    };
  });
};

export const createTimeOptions = (): DiscoveryTimeOption[] =>
  Array.from(
    { length: (LAST_TIME_MINUTES - FIRST_TIME_MINUTES) / TIME_INTERVAL_MINUTES + 1 },
    (_unused, index) => {
      const minutesSinceMidnight = FIRST_TIME_MINUTES + index * TIME_INTERVAL_MINUTES;
      const hours = Math.floor(minutesSinceMidnight / 60);
      const minutes = minutesSinceMidnight % 60;
      const date = new Date(2020, 0, 1, hours, minutes);
      return {
        timeKey: `${pad(hours)}:${pad(minutes)}`,
        label: new Intl.DateTimeFormat('en-AU', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(date).toUpperCase(),
        minutesSinceMidnight,
      };
    },
  );

export const formatRequestedDateTime = (
  requestedDateTime: string,
  now: Date = new Date(),
): string => {
  const selected = new Date(requestedDateTime);
  const dateKey = getLocalDateKey(selected);
  const dateOption = createDateOptions(now).find((option) => option.dateKey === dateKey);
  const dateLabel = dateOption?.label ?? new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
  }).format(selected).replace(',', '');
  const timeLabel = createTimeOptions().find(
    (option) => option.timeKey === getLocalTimeKey(selected),
  )?.label ?? new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(selected).toUpperCase();
  return `${dateLabel} ${timeLabel}`;
};

export const isRequestedDateTimeNearNow = (
  requestedDateTime: string,
  now: Date = new Date(),
): boolean => {
  const differenceMinutes = (new Date(requestedDateTime).getTime() - now.getTime()) / 60_000;
  return Number.isFinite(differenceMinutes) && differenceMinutes >= -15 && differenceMinutes <= 45;
};
