import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NewPlannedExperience, PlannedExperience } from './types';

const storageKey = 'sponsays.demo.planned.v1';
const cache = new Map<string, PlannedExperience>();

const withDates = (input: NewPlannedExperience): PlannedExperience => {
  const now = new Date().toISOString();
  return { ...input, createdAt: now, updatedAt: now };
};

export const cachePlannedExperience = (plan: PlannedExperience): void => { cache.set(plan.id, plan); };
export const getCachedPlannedExperience = (id: string): PlannedExperience | undefined => cache.get(id);

export const saveDemoPlannedExperience = async (input: NewPlannedExperience): Promise<PlannedExperience> => {
  const current = await getDemoPlannedExperiences();
  const plan = withDates(input);
  await AsyncStorage.setItem(storageKey, JSON.stringify([plan, ...current.filter((item) => item.id !== plan.id)]));
  cachePlannedExperience(plan);
  return plan;
};

export const getDemoPlannedExperiences = async (): Promise<PlannedExperience[]> => {
  try {
    const value = await AsyncStorage.getItem(storageKey);
    return value ? JSON.parse(value) as PlannedExperience[] : [];
  } catch { return []; }
};

export const updateDemoPlannedExperience = async (
  id: string,
  updates: Partial<PlannedExperience>,
): Promise<PlannedExperience | undefined> => {
  const plans = await getDemoPlannedExperiences();
  const existing = plans.find((item) => item.id === id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(storageKey, JSON.stringify(plans.map((item) => item.id === id ? updated : item)));
  cachePlannedExperience(updated);
  return updated;
};
