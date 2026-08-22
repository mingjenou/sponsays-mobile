export type PlannedStatus = 'planned' | 'completed' | 'cancelled';
export type ReminderOffsetMinutes = 30 | 60 | 120 | 1440 | null;

export interface PlannedExperience {
  id: string;
  userId?: string;
  recommendationId?: string;
  externalPlaceId: string;
  provider: string;
  placeName: string;
  description?: string;
  sourceUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  plannedFor: string;
  status: PlannedStatus;
  calendarEventId?: string;
  notificationId?: string;
  reminderOffsetMinutes: ReminderOffsetMinutes;
  estimatedDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export type NewPlannedExperience = Omit<PlannedExperience, 'userId' | 'createdAt' | 'updatedAt'>;
