import type { PlannedExperience } from '@/src/features/planned/types';

export interface CalendarEventDetails { title: string; startDate: Date; endDate: Date; location?: string; notes?: string }
export interface CalendarCoreGateway {
  hasPermission(): Promise<boolean>; requestPermission(): Promise<boolean>;
  eventExists(id: string): Promise<boolean>; getWritableCalendarId(): Promise<string | undefined>;
  createEvent(calendarId: string, details: CalendarEventDetails): Promise<string>;
}
export type CalendarCoreResult = { status: 'added' | 'existing'; eventId: string } | { status: 'denied' | 'unavailable'; message: string };

export const getCalendarEventDetails = (plan: PlannedExperience): CalendarEventDetails => {
  const startDate = new Date(plan.plannedFor);
  const duration = plan.estimatedDurationMinutes && plan.estimatedDurationMinutes > 0 ? plan.estimatedDurationMinutes : 120;
  return { title: `SponSays — ${plan.placeName}`, startDate, endDate: new Date(startDate.getTime() + duration * 60_000), ...(plan.address ? { location: plan.address } : {}), ...((plan.description || plan.sourceUrl) ? { notes: [plan.description, plan.sourceUrl].filter(Boolean).join('\n\n') } : {}) };
};

export const addPlanToCalendarWithGateway = async (plan: PlannedExperience, gateway: CalendarCoreGateway): Promise<CalendarCoreResult> => {
  if (plan.calendarEventId && await gateway.eventExists(plan.calendarEventId)) return { status: 'existing', eventId: plan.calendarEventId };
  if (!(await gateway.hasPermission()) && !(await gateway.requestPermission())) return { status: 'denied', message: 'Calendar access is off. Your plan is still safely here.' };
  const calendarId = await gateway.getWritableCalendarId();
  if (!calendarId) return { status: 'unavailable', message: "We couldn't find a writable calendar on this device." };
  return { status: 'added', eventId: await gateway.createEvent(calendarId, getCalendarEventDetails(plan)) };
};
