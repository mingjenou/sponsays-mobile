import type { PlannedExperience, ReminderOffsetMinutes } from '@/src/features/planned/types';

export interface NotificationCoreGateway {
  hasPermission(): Promise<boolean>; requestPermission(): Promise<boolean>;
  schedule(date: Date, title: string, body: string): Promise<string>; cancel(id: string): Promise<void>;
}
export type ReminderCoreResult = { status: 'scheduled'; notificationId: string } | { status: 'off' | 'denied' | 'too_late'; message?: string };
export const reminderDateFor = (plannedFor: string, offset: Exclude<ReminderOffsetMinutes, null>): Date => new Date(Date.parse(plannedFor) - offset * 60_000);
export const cancelPlanReminderWithGateway = async (id: string | undefined, gateway: NotificationCoreGateway): Promise<void> => { if (id) await gateway.cancel(id); };
export const setPlanReminderWithGateway = async (plan: PlannedExperience, offset: ReminderOffsetMinutes, gateway: NotificationCoreGateway, now = new Date()): Promise<ReminderCoreResult> => {
  await cancelPlanReminderWithGateway(plan.notificationId, gateway);
  if (offset === null) return { status: 'off' };
  const date = reminderDateFor(plan.plannedFor, offset);
  if (date.getTime() <= now.getTime()) return { status: 'too_late', message: 'That reminder time has already passed. Choose a shorter reminder.' };
  if (!(await gateway.hasPermission()) && !(await gateway.requestPermission())) return { status: 'denied', message: 'Notifications are off. Your plan is still safely here.' };
  return { status: 'scheduled', notificationId: await gateway.schedule(date, 'SponSays', `Your SponSay at ${plan.placeName} is coming up.`) };
};
