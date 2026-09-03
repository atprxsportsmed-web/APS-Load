// Central decision engine for ATPRX participation decision support.
//
// ARCHITECTURE PRINCIPLE:
// All participation decision logic lives here — not scattered across UI components.
// Each rule is independently testable and returns the rule ID it triggered.
//
// Usage:
//   import { classify } from '@/decision-engine';
//   const decision = classify({ safety, symptoms, movement, load, reassess });

export { classify } from './classificationRules';
export { evaluateSafetyScreen, classifyFlag } from './safetyRules';
export { evaluateMovement } from './movementRules';
export { evaluateLoad } from './loadRules';
export { evaluateTrajectory, classifyFollowUpTrajectory, SESSIONS_WITHOUT_IMPROVEMENT_THRESHOLD } from './trajectoryRules';
export { generateExplanation } from './explanationGenerator';
export { determineReferralLevel, generateMonitoringInstructions } from './referralRules';
export type {
  ParticipationClassification,
  ParticipationDecision,
  ReferralLevel,
  RecommendedModifications,
  EngineInput,
  SafetyInput,
  SymptomInput,
  MovementInput,
  LoadInput,
  ReassessInput,
  LongitudinalInput,
  MovementAvailability,
  TaskRangeAccess,
  ForceProduction,
  MovementQuality,
  SymptomBehavior,
  StabilityConfidence,
  PostLoadOverall,
} from './types';
