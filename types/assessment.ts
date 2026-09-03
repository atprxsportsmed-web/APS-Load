// ⚠️ CLINICAL NOTICE: This tool is a coach participation-decision support aid.
// It does NOT diagnose injuries, provide medical clearance, or replace evaluation
// by an athletic trainer, physical therapist, physician, or other healthcare
// professional. All decision rules must be reviewed by a licensed sports medicine
// professional before clinical or public deployment.
//
// EVIDENCE LANGUAGE: ATPRX uses an evidence-informed synthesis of established
// principles from sports medicine, load management, pain monitoring, functional
// assessment, and return-to-participation decision-making. The complete
// classification algorithm has not independently undergone prospective clinical
// validation.

import type { ParticipationDecision } from '../decision-engine/types';

// ── Legacy 4-color classification (backward compat for stored assessments) ──
export type Classification = 'green' | 'yellow' | 'orange' | 'red';

// Re-export new types for convenience
export type { ParticipationDecision } from '../decision-engine/types';
export type { ParticipationClassification } from '../decision-engine/types';

// ── Core types ─────────────────────────────────────────────────────────────

export type BodyRegion =
  | 'head' | 'neck' | 'upper_back' | 'low_back'
  | 'shoulder' | 'upper_arm' | 'elbow' | 'forearm'
  | 'wrist' | 'hand_fingers' | 'hip_groin' | 'thigh'
  | 'knee' | 'lower_leg' | 'ankle' | 'foot_toes'
  | 'general_soreness' | 'other';

export type Side = 'left' | 'right' | 'both' | 'central' | 'not_applicable';
export type Trend = 'improving' | 'stable' | 'worsening';

/** Movement availability (was "RangeStatus") — renamed in spirit; backward compat value kept */
export type RangeStatus = 'full' | 'mildly_reduced' | 'clearly_reduced' | 'unable';

export type SymptomResponse = 'improved' | 'unchanged' | 'worsened';
/** Extended repeated-movement response including new spec values */
export type RepeatedMovementResponse =
  | 'improved' | 'unchanged' | 'worsened'     // legacy values
  | 'improves' | 'stable' | 'progressively_worsens'; // new spec values

export type StrengthResponse = 'normal' | 'mildly_reduced' | 'clearly_reduced';
export type StabilityResponse = 'stable' | 'uncertain' | 'unstable';
export type OverallResponse =
  | 'clearly_improved' | 'mildly_improved' | 'unchanged' | 'mildly_worse' | 'clearly_worse';
export type PostLoadOverall = 'improved' | 'stable' | 'worsened';
export type NextDayResponse =
  | 'recovered' | 'mild_response' | 'excessive_response' | 'worsening';
export type SessionTiming = 'warmup' | 'first_set' | 'halfway' | 'post_session';

// ── New 5-domain load check types ─────────────────────────────────────────

export type TaskRangeAccess =
  | 'yes_normally'
  | 'yes_mild_symptoms'
  | 'yes_with_compensation'
  | 'only_partially'
  | 'no';

export type ForceProduction = 'expected' | 'mildly_reduced' | 'clearly_reduced' | 'unable';
export type MovementQuality = 'normal' | 'mild_compensation' | 'clear_compensation' | 'unable';
export type SymptomBehavior = 'improving' | 'stable' | 'progressively_worsening';
export type StabilityConfidence = 'normal' | 'mildly_uncertain' | 'clearly_unstable';

// ── Data interfaces ────────────────────────────────────────────────────────

export interface SafetyScreenData {
  selectedFlags: string[];
  hasUrgentFlag: boolean;
}

export interface SymptomContextData {
  bodyRegion: BodyRegion;
  side: Side;
  activity: string;
  onsetTiming: 'sudden' | 'gradual';
  directTrauma: boolean;
  painRating: number;
  qualities: string[];
  swelling: boolean;
  instability: boolean;
  locking: boolean;
  numbnessTingling: boolean;
  nightPain: boolean;
  restPain: boolean;
  trend: Trend;
  previousHistory: boolean;
}

export interface MovementData {
  /** Overall movement availability (legacy: rangeStatus) */
  rangeStatus: RangeStatus;
  /** Can the athlete access the movement required for today's intended activity? */
  taskRangeAccess?: TaskRangeAccess;
  /** How did symptoms respond during repeated active movement? */
  repeatedMovementResponse: RepeatedMovementResponse;
}

export interface LoadTestData {
  testDescription: string;
  // Pain collected for monitoring only — does NOT drive classification (see Pain Rule)
  painBefore: number;
  painDuring: number;
  painAfter: number;

  // ── New 5-domain fields (used by decision engine) ──────────────────────
  forceProduction?: ForceProduction;
  movementQuality?: MovementQuality;
  symptomBehavior?: SymptomBehavior;
  stabilityConfidence?: StabilityConfidence;

  // ── Legacy fields (backward compat) ──────────────────────────────────
  strengthResponse: StrengthResponse;
  stabilityResponse: StabilityResponse;
  compensationPresent: boolean;
  symptomResponse: SymptomResponse;
  stoppedEarly: boolean;
}

export interface ReassessmentData {
  rangeResponse: SymptomResponse;
  strengthResponse: SymptomResponse;
  confidenceResponse: SymptomResponse;
  /** Symptom comparison before vs after — new domain */
  symptomsResponse?: SymptomResponse;
  /** Movement quality comparison — new domain */
  movementQualityResponse?: SymptomResponse;
  /** Simplified 3-state overall post-load response (new) */
  postLoadOverall?: PostLoadOverall;
  /** Legacy 5-state overall response */
  overallResponse: OverallResponse;
}

export interface SessionCheckin {
  id: string;
  timing: SessionTiming;
  createdAt: string;
  symptoms: SymptomResponse;
  rangeOfMotion: SymptomResponse;
  strength: SymptomResponse;
  movementQuality: SymptomResponse;
  newRedFlags: boolean;
  updatedClassification: Classification;
}

export interface FollowUpData {
  completedAt: string;
  symptomsAtRest: 'none' | 'mild' | 'moderate' | 'significant';
  symptomsWithActivity: 'none' | 'mild' | 'moderate' | 'significant';
  morningStiffness: boolean;
  swelling: boolean;
  rangeOfMotion: SymptomResponse;
  strength: SymptomResponse;
  comparedToBefore: 'better' | 'same' | 'worse';
  sleepAffected: boolean;
  activityLimited: boolean;
  nextDayResponse: NextDayResponse;
}

export interface Assessment {
  id: string;
  createdAt: string;
  updatedAt: string;
  safetyScreen: SafetyScreenData;
  symptomContext?: SymptomContextData;
  movementAssessment?: MovementData;
  loadTest?: LoadTestData;
  reassessment?: ReassessmentData;
  /** Legacy 4-color classification (stored for backward compat) */
  classification: Classification;
  classificationReasons: string[];
  modifications: string[];
  sessionCheckins: SessionCheckin[];
  followUp?: FollowUpData;
  emergencyStop?: boolean;
  /** Rich participation decision from the new engine (present on new assessments) */
  participationDecision?: ParticipationDecision;
}

// ── Static data ────────────────────────────────────────────────────────────

export const BODY_REGIONS: { value: BodyRegion; label: string }[] = [
  { value: 'head', label: 'Head' },
  { value: 'neck', label: 'Neck' },
  { value: 'upper_back', label: 'Upper Back' },
  { value: 'low_back', label: 'Low Back' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'upper_arm', label: 'Upper Arm' },
  { value: 'elbow', label: 'Elbow' },
  { value: 'forearm', label: 'Forearm' },
  { value: 'wrist', label: 'Wrist' },
  { value: 'hand_fingers', label: 'Hand / Fingers' },
  { value: 'hip_groin', label: 'Hip / Groin' },
  { value: 'thigh', label: 'Thigh' },
  { value: 'knee', label: 'Knee' },
  { value: 'lower_leg', label: 'Lower Leg / Shin' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'foot_toes', label: 'Foot / Toes' },
  { value: 'general_soreness', label: 'General Soreness' },
  { value: 'other', label: 'Other' },
];

export const URGENT_FLAGS: { id: string; label: string; level: 'emergency' | 'urgent' }[] = [
  { id: 'obvious_deformity', label: 'Obvious deformity', level: 'urgent' },
  { id: 'suspected_fracture', label: 'Suspected fracture', level: 'urgent' },
  { id: 'unable_to_bear_weight', label: 'Unable to bear weight after acute injury', level: 'urgent' },
  { id: 'unable_to_move', label: 'Unable to actively move the affected area at all', level: 'urgent' },
  { id: 'major_swelling_immediate', label: 'Major swelling developing immediately after onset', level: 'urgent' },
  { id: 'joint_instability', label: 'Joint feels unstable or repeatedly gives way', level: 'urgent' },
  { id: 'numbness_tingling', label: 'Numbness or tingling', level: 'urgent' },
  { id: 'spreading_weakness', label: 'Spreading or progressive weakness', level: 'urgent' },
  { id: 'bowel_bladder', label: 'Loss of bowel or bladder control', level: 'emergency' },
  { id: 'saddle_numbness', label: 'Numbness in the groin or saddle region', level: 'emergency' },
  { id: 'chest_pain', label: 'Chest pain or tightness', level: 'emergency' },
  { id: 'breathing_difficulty', label: 'Difficulty breathing', level: 'emergency' },
  { id: 'fainting_dizziness', label: 'Fainting or severe dizziness', level: 'emergency' },
  { id: 'severe_headache', label: 'Severe headache after a head impact', level: 'emergency' },
  { id: 'confusion_after_impact', label: 'Confusion or disorientation after head impact', level: 'emergency' },
  { id: 'neck_pain_trauma', label: 'Neck pain after significant trauma', level: 'urgent' },
  { id: 'pop_loss_function', label: 'Audible pop with immediate loss of function', level: 'urgent' },
  { id: 'rapidly_worsening', label: 'Symptoms rapidly getting worse', level: 'urgent' },
  { id: 'severe_unexplained', label: 'Severe symptoms that feel unexplained', level: 'urgent' },
  { id: 'believes_emergency', label: 'You believe this may be an emergency', level: 'emergency' },
];

export const SYMPTOM_QUALITIES: { id: string; label: string }[] = [
  { id: 'stiffness', label: 'Stiffness' },
  { id: 'soreness', label: 'Soreness' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'aching', label: 'Aching' },
  { id: 'burning', label: 'Burning' },
  { id: 'catching', label: 'Catching' },
];

/**
 * 7 demand variable categories (per spec Load Modification Engine).
 * Recommendations use category language — not specific percentages.
 * Do NOT present percentages as medically validated thresholds.
 */
export const MODIFICATION_OPTIONS: {
  id: string;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    id: 'volume',
    label: 'Volume',
    description: 'Reduce total training volume for the affected movement.',
    example: 'Fewer total sets or repetitions while keeping movement quality high.',
  },
  {
    id: 'intensity',
    label: 'Intensity',
    description: 'Reduce the loading intensity or external load.',
    example: 'Use a lighter load or reduced resistance and progressively reassess.',
  },
  {
    id: 'velocity',
    label: 'Velocity',
    description: 'Avoid high-velocity or ballistic movement exposure.',
    example: 'Use controlled, slower movement instead of explosive or fast-tempo variations.',
  },
  {
    id: 'rangeOfMotion',
    label: 'Range of Motion',
    description: 'Temporarily reduce the required range of motion.',
    example: 'Use a partial range while maintaining comfortable loading.',
  },
  {
    id: 'contact',
    label: 'Contact Exposure',
    description: 'Avoid contact exposure while continuing appropriate non-contact training.',
    example: 'Non-contact training continues; remove contact drills or activities.',
  },
  {
    id: 'complexity',
    label: 'Complexity',
    description: 'Reduce movement complexity or use a more supported variation.',
    example: 'Use a simpler movement pattern or add external support.',
  },
  {
    id: 'fatigueExposure',
    label: 'Training Density / Fatigue',
    description: 'Reduce training density and accumulated fatigue for the affected area.',
    example: 'Longer rest between sets; avoid repeated exposure late in high-fatigue sessions.',
  },
];
