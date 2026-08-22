import * as Calendar from 'expo-calendar';
import type { PlannedExperience } from '@/src/features/planned/types';
import { addPlanToCalendarWithGateway } from './calendarCore';

export const addPlanToCalendar = (plan: PlannedExperience) => addPlanToCalendarWithGateway(plan, {
  hasPermission: async () => (await Calendar.getCalendarPermissionsAsync()).granted,
  requestPermission: async () => (await Calendar.requestCalendarPermissionsAsync()).granted,
  eventExists: async (id) => { try { await Calendar.getEventAsync(id); return true; } catch { return false; } },
  getWritableCalendarId: async () => {
    try { return (await Calendar.getDefaultCalendarAsync()).id; }
    catch { return (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find((item) => item.allowsModifications)?.id; }
  },
  createEvent: (calendarId, details) => Calendar.createEventAsync(calendarId, details),
});
