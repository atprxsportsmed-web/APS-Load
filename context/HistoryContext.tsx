import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Assessment } from '@/types/assessment';
import {
  loadAssessments,
  saveAssessment,
  deleteAssessment,
  deleteAllAssessments,
} from '@/services/storage';

interface HistoryContextValue {
  assessments: Assessment[];
  isLoading: boolean;
  save: (assessment: Assessment) => Promise<void>;
  update: (assessment: Assessment) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
  getById: (id: string) => Assessment | undefined;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

// Open-access build: no accounts, so history lives on-device only.
export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const local = await loadAssessments();
      setAssessments(local);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (assessment: Assessment) => {
    await saveAssessment(assessment);
    setAssessments(prev => {
      const idx = prev.findIndex(a => a.id === assessment.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = assessment;
        return updated;
      }
      return [assessment, ...prev];
    });
  }, []);

  const update = useCallback(async (assessment: Assessment) => {
    const updated = { ...assessment, updatedAt: new Date().toISOString() };
    await saveAssessment(updated);
    setAssessments(prev => prev.map(a => (a.id === updated.id ? updated : a)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAssessment(id);
    setAssessments(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await deleteAllAssessments();
    setAssessments([]);
  }, []);

  const getById = useCallback(
    (id: string) => assessments.find(a => a.id === id),
    [assessments],
  );

  return (
    <HistoryContext.Provider
      value={{ assessments, isLoading, save, update, remove, clearAll, refresh, getById }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}
