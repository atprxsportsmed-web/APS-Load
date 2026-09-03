import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  SafetyScreenData,
  SymptomContextData,
  MovementData,
  LoadTestData,
  ReassessmentData,
} from '@/types/assessment';
import { generateId } from '@/services/storage';

interface AssessmentContextValue {
  assessmentId: string | null;
  safetyScreen: SafetyScreenData | null;
  symptomContext: SymptomContextData | null;
  movementData: MovementData | null;
  loadTestData: LoadTestData | null;
  reassessmentData: ReassessmentData | null;
  modifications: string[];
  startAssessment: () => string;
  setSafetyScreen: (data: SafetyScreenData) => void;
  setSymptomContext: (data: SymptomContextData) => void;
  setMovementData: (data: MovementData) => void;
  setLoadTestData: (data: LoadTestData) => void;
  setReassessmentData: (data: ReassessmentData) => void;
  setModifications: (mods: string[]) => void;
  resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [safetyScreen, setSafetyScreenState] = useState<SafetyScreenData | null>(null);
  const [symptomContext, setSymptomContextState] = useState<SymptomContextData | null>(null);
  const [movementData, setMovementDataState] = useState<MovementData | null>(null);
  const [loadTestData, setLoadTestDataState] = useState<LoadTestData | null>(null);
  const [reassessmentData, setReassessmentDataState] = useState<ReassessmentData | null>(null);
  const [modifications, setModificationsState] = useState<string[]>([]);

  const startAssessment = useCallback(() => {
    const id = generateId();
    setAssessmentId(id);
    setSafetyScreenState(null);
    setSymptomContextState(null);
    setMovementDataState(null);
    setLoadTestDataState(null);
    setReassessmentDataState(null);
    setModificationsState([]);
    return id;
  }, []);

  const resetAssessment = useCallback(() => {
    setAssessmentId(null);
    setSafetyScreenState(null);
    setSymptomContextState(null);
    setMovementDataState(null);
    setLoadTestDataState(null);
    setReassessmentDataState(null);
    setModificationsState([]);
  }, []);

  return (
    <AssessmentContext.Provider
      value={{
        assessmentId,
        safetyScreen,
        symptomContext,
        movementData,
        loadTestData,
        reassessmentData,
        modifications,
        startAssessment,
        setSafetyScreen: setSafetyScreenState,
        setSymptomContext: setSymptomContextState,
        setMovementData: setMovementDataState,
        setLoadTestData: setLoadTestDataState,
        setReassessmentData: setReassessmentDataState,
        setModifications: setModificationsState,
        resetAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
