import * as Notifications from 'expo-notifications';
import type { PlannedExperience, ReminderOffsetMinutes } from '@/src/features/planned/types';
import { cancelPlanReminderWithGateway, setPlanReminderWithGateway, type NotificationCoreGateway } from './notificationCore';

const gateway: NotificationCoreGateway = {
  hasPermission: async () => (await Notifications.getPermissionsAsync()).granted,
  requestPermission: async () => (await Notifications.requestPermissionsAsync()).granted,
  schedule: (date, title, body) => Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } }),
  cancel: Notifications.cancelScheduledNotificationAsync,
};
export const configureLocalNotifications = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
};
export const cancelPlanReminder = (id?: string) => cancelPlanReminderWithGateway(id, gateway);
export const setPlanReminder = (plan: PlannedExperience, offset: ReminderOffsetMinutes) => setPlanReminderWithGateway(plan, offset, gateway);
