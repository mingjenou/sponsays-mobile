export function formatDuration(minutes?: number): string {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) return '—';

  const roundedMinutes = Math.round(minutes);
  if (roundedMinutes < 60) return `${roundedMinutes} min`;

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  const hourLabel = hours === 1 ? 'hr' : 'hrs';

  return remainingMinutes === 0
    ? `${hours} ${hourLabel}`
    : `${hours} ${hourLabel} ${remainingMinutes} min`;
}
