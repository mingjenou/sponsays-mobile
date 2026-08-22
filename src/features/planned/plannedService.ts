import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';
import type { NewPlannedExperience, PlannedExperience } from './types';

type PlannedRow = {
  id: string; user_id: string; recommendation_id: string | null; external_place_id: string;
  provider: string; place_name: string; description: string | null; source_url: string | null;
  address: string | null; latitude: number | null; longitude: number | null; category: string | null;
  planned_for: string; status: 'planned' | 'completed' | 'cancelled'; calendar_event_id: string | null;
  notification_id: string | null; reminder_offset_minutes: number | null;
  estimated_duration_minutes: number | null; created_at: string; updated_at: string;
};

export const mapPlannedRow = (row: PlannedRow): PlannedExperience => ({
  id: row.id, userId: row.user_id,
  ...(row.recommendation_id ? { recommendationId: row.recommendation_id } : {}),
  externalPlaceId: row.external_place_id, provider: row.provider, placeName: row.place_name,
  ...(row.description ? { description: row.description } : {}),
  ...(row.source_url ? { sourceUrl: row.source_url } : {}),
  ...(row.address ? { address: row.address } : {}),
  ...(row.latitude === null ? {} : { latitude: row.latitude }),
  ...(row.longitude === null ? {} : { longitude: row.longitude }),
  ...(row.category ? { category: row.category } : {}),
  plannedFor: row.planned_for, status: row.status,
  ...(row.calendar_event_id ? { calendarEventId: row.calendar_event_id } : {}),
  ...(row.notification_id ? { notificationId: row.notification_id } : {}),
  reminderOffsetMinutes: row.reminder_offset_minutes as PlannedExperience['reminderOffsetMinutes'],
  ...(row.estimated_duration_minutes === null ? {} : { estimatedDurationMinutes: row.estimated_duration_minutes }),
  createdAt: row.created_at, updatedAt: row.updated_at,
});

const selectFields = 'id, user_id, recommendation_id, external_place_id, provider, place_name, description, source_url, address, latitude, longitude, category, planned_for, status, calendar_event_id, notification_id, reminder_offset_minutes, estimated_duration_minutes, created_at, updated_at';

export const createMyPlannedExperience = async (input: NewPlannedExperience): Promise<DataServiceResult<PlannedExperience>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();
  try {
    const values = {
      id: input.id, user_id: context.user.id, recommendation_id: input.recommendationId ?? null,
      external_place_id: input.externalPlaceId, provider: input.provider, place_name: input.placeName,
      description: input.description ?? null, source_url: input.sourceUrl ?? null, address: input.address ?? null,
      latitude: input.latitude ?? null, longitude: input.longitude ?? null, category: input.category ?? null,
      planned_for: input.plannedFor, status: input.status, calendar_event_id: input.calendarEventId ?? null,
      notification_id: input.notificationId ?? null, reminder_offset_minutes: input.reminderOffsetMinutes,
      estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
    };
    const { data, error } = await withRequestTimeout(
      context.client.from('planned_experiences').insert(values).select(selectFields).single(), 'create-plan');
    if (error) return dataFailure('create-plan', error, "We couldn't save this plan to your account yet.");
    return dataSuccess(mapPlannedRow(data as PlannedRow));
  } catch (error) { return dataFailure('create-plan', error, "We couldn't save this plan to your account yet."); }
};

export const getMyPlannedExperiences = async (): Promise<DataServiceResult<PlannedExperience[]>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();
  try {
    const { data, error } = await withRequestTimeout(
      context.client.from('planned_experiences').select(selectFields).eq('user_id', context.user.id).order('planned_for', { ascending: true }).limit(100), 'get-plans');
    if (error) return dataFailure('get-plans', error, "We couldn't load your plans right now.");
    return dataSuccess((data as PlannedRow[]).map(mapPlannedRow));
  } catch (error) { return dataFailure('get-plans', error, "We couldn't load your plans right now."); }
};

export const updateMyPlannedExperience = async (
  id: string,
  updates: Partial<Pick<PlannedExperience, 'status' | 'calendarEventId' | 'notificationId' | 'reminderOffsetMinutes' | 'plannedFor'>>,
): Promise<DataServiceResult<PlannedExperience>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();
  const values = {
    ...(updates.status ? { status: updates.status } : {}),
    ...('calendarEventId' in updates ? { calendar_event_id: updates.calendarEventId ?? null } : {}),
    ...('notificationId' in updates ? { notification_id: updates.notificationId ?? null } : {}),
    ...('reminderOffsetMinutes' in updates ? { reminder_offset_minutes: updates.reminderOffsetMinutes } : {}),
    ...(updates.plannedFor ? { planned_for: updates.plannedFor } : {}),
  };
  try {
    const { data, error } = await withRequestTimeout(
      context.client.from('planned_experiences').update(values).eq('id', id).eq('user_id', context.user.id).select(selectFields).single(), 'update-plan');
    if (error) return dataFailure('update-plan', error, "We couldn't update this plan right now.");
    return dataSuccess(mapPlannedRow(data as PlannedRow));
  } catch (error) { return dataFailure('update-plan', error, "We couldn't update this plan right now."); }
};
