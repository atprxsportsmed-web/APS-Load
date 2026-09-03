// ⚠️ CLINICAL NOTICE: This classification engine uses evidence-informed
// principles from sports medicine, load management, pain monitoring, functional
// assessment, and return-to-participation decision-making. It has NOT undergone
// independent prospective clinical validation and must be reviewed by a licensed
// sports medicine professional before any clinical or public deployment.
//
// Core design principle: ATPRX is a coach participation-decision support tool.
// It does NOT diagnose injuries, provide medical clearance, or replace evaluation
// by an athletic trainer, physical therapist, physician, or other healthcare
// professional. Participation is the starting assumption — ATPRX identifies
// reasons to MODIFY or restrict, not reasons to "clear" an athlete.

// ── Classification states ──────────────────────────────────────────────────

export type ParticipationClassification =
  | 'continue'          // No participation-limiting findings
  | 'modify'            // Useful capacity remains; today's demand exceeds current tolerance
  | 'change_goal'       // Meaningful capacity loss; shift session priority
  | 'stop_refer'        // Loading not appropriate; seek sports medicine evaluation
  | 'urgent_referral'   // Prompt medical evaluation needed
  | 'emergency_referral'; // Immediate emergency medical evaluation needed

export type ReferralLevel = 'none' | 'sports_medicine' | 'urgent_medical' | 'emergency';

// ── Load modification categories (7 demand variables from spec) ────────────

export interface RecommendedModifications {
  volume?: boolean;          // Reduce total sets/reps/duration
  intensity?: boolean;       // Reduce loading intensity / external load
  velocity?: boolean;        // Avoid high-velocity or ballistic exposure
  rangeOfMotion?: boolean;   // Temporarily reduce required range
  contact?: boolean;         // Avoid contact exposure
  complexity?: boolean;      // Reduce movement complexity
  fatigueExposure?: boolean; // Reduce training density / fatigue accumulation
}

// ── Main output ────────────────────────────────────────────────────────────

export interface ParticipationDecision {
  classification: ParticipationClassification;
  /** Plain-language reasons for the classification */
  reasons: string[];
  /** Machine-readable rule IDs that fired — supports testing and audit */
  triggeredRules: string[];
  /** Which demand variables should be reduced (relevant for modify/change_goal) */
  recommendedModifications: RecommendedModifications;
  /** What to watch for during/after training */
  monitoringInstructions: string[];
  /** What level of care is recommended */
  referralLevel: ReferralLevel;
  /** 1-3 plain-language sentences explaining the recommendation to the coach */
  educationalExplanation: string;
}

// ── Input types for the engine ─────────────────────────────────────────────

export interface SafetyInput {
  selectedFlags: string[];
  hasUrgentFlag: boolean;
}

export interface SymptomInput {
  numbnessTingling?: boolean;
  instability?: boolean;
  locking?: boolean;
  trend?: 'improving' | 'stable' | 'worsening';
}

export type MovementAvailability = 'normal' | 'full' | 'mildly_reduced' | 'clearly_reduced' | 'unable';

export type TaskRangeAccess =
  | 'yes_normally'
  | 'yes_mild_symptoms'
  | 'yes_with_compensation'
  | 'only_partially'
  | 'no';

export type RepeatedMovementResponse = 'improves' | 'stable' | 'progressively_worsens';

export interface MovementInput {
  /** How available is active movement in the affected area? */
  rangeStatus: MovementAvailability;
  /** Can the athlete access the movement required for today's intended task? */
  taskRangeAccess?: TaskRangeAccess;
  /** How did symptoms respond during repeated active movement? */
  repeatedMovementResponse: RepeatedMovementResponse | 'improved' | 'unchanged' | 'worsened'; // legacy compat
}

export type ForceProduction = 'expected' | 'mildly_reduced' | 'clearly_reduced' | 'unable';
export type MovementQuality = 'normal' | 'mild_compensation' | 'clear_compensation' | 'unable';
export type SymptomBehavior = 'improving' | 'stable' | 'progressively_worsening';
export type StabilityConfidence = 'normal' | 'mildly_uncertain' | 'clearly_unstable';

export interface LoadInput {
  /** Force production during the Controlled Load Check */
  forceProduction?: ForceProduction;
  /** Movement quality during the Controlled Load Check */
  movementQuality?: MovementQuality;
  /** How symptoms behaved as task demand increased */
  symptomBehavior?: SymptomBehavior;
  /** Stability and confidence during loading */
  stabilityConfidence?: StabilityConfidence;
  /** Was the load check stopped early due to symptom escalation? */
  stoppedEarly: boolean;
  // Legacy fields — used when new fields absent
  strengthResponse?: 'normal' | 'mildly_reduced' | 'clearly_reduced';
  compensationPresent?: boolean;
  symptomResponse?: 'improved' | 'unchanged' | 'worsened';
  stabilityResponse?: 'stable' | 'uncertain' | 'unstable';
}

export type PostLoadOverall = 'improved' | 'stable' | 'worsened';

export interface ReassessInput {
  rangeResponse: 'improved' | 'unchanged' | 'worsened';
  strengthResponse: 'improved' | 'unchanged' | 'worsened';
  confidenceResponse: 'improved' | 'unchanged' | 'worsened';
  symptomsResponse?: 'improved' | 'unchanged' | 'worsened';
  movementQualityResponse?: 'improved' | 'unchanged' | 'worsened';
  /** Simplified 3-state post-load overall response */
  postLoadOverall?: PostLoadOverall;
  // Legacy
  overallResponse?: 'clearly_improved' | 'mildly_improved' | 'unchanged' | 'mildly_worse' | 'clearly_worse';
}

export interface LongitudinalInput {
  /** Trajectory from follow-up / previous sessions */
  trajectory?: 'better' | 'back_to_baseline' | 'mildly_worse' | 'clearly_worse';
  /** Number of sessions without meaningful improvement (for escalation) */
  sessionsWithoutImprovement?: number;
}

export interface EngineInput {
  safety: SafetyInput;
  symptoms?: SymptomInput;
  movement?: MovementInput;
  load?: LoadInput;
  reassess?: ReassessInput;
  longitudinal?: LongitudinalInput;
}
