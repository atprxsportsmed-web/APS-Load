import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Assessment } from '@/types/assessment';

const ASSESSMENTS_KEY = 'athlete_load_assessments_v1';

export async function loadAssessments(): Promise<Assessment[]> {
  try {
    const raw = await AsyncStorage.getItem(ASSESSMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Assessment[];
  } catch {
    return [];
  }
}

export async function saveAssessment(assessment: Assessment): Promise<void> {
  try {
    const existing = await loadAssessments();
    const idx = existing.findIndex(a => a.id === assessment.id);
    if (idx >= 0) {
      existing[idx] = assessment;
    } else {
      existing.unshift(assessment);
    }
    await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(existing));
  } catch {
    // Silently fail for MVP — data is best-effort
  }
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const all = await loadAssessments();
  return all.find(a => a.id === id) ?? null;
}

export async function deleteAssessment(id: string): Promise<void> {
  try {
    const existing = await loadAssessments();
    const updated = existing.filter(a => a.id !== id);
    await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function deleteAllAssessments(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ASSESSMENTS_KEY);
  } catch {}
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
