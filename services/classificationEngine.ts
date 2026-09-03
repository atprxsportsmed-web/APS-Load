// ⚠️ CLINICAL NOTICE: Clinical decision content must be reviewed by a qualified
// healthcare professional before public release. This tool does NOT diagnose
// injuries or replace evaluation by a licensed healthcare professional.
//
// ARCHITECTURE: This file is an adapter over the centralized decision engine
// at decision-engine/. All classification logic lives there — not here.
// This adapter maintains backward compatibility with existing call sites.

import { classify } from '@/decision-engine';
import type {
  EngineInput,
  ParticipationClassification,
  ParticipationDecision,
} from '@/decision-engine';
import type {
  Assessment,
  Classification,
} from '@/types/assessment';

// ── ClassificationResult (legacy interface — kept for backward compat) ──────

export interface ClassificationResult {
  classification: Classification;
  reasons: string[];
  participationDecision?: ParticipationDecision;
}

// ── Mapping: new 6-state → legacy 4-color ─────────────────────────────────

export function participationToClassification(p: ParticipationClassification): Classification {
  switch (p) {
    case 'continue':       return 'green';
    case 'modify':         return 'yellow';
    case 'change_goal':    return 'orange';
    case 'stop_refer':
    case 'urgent_referral':
    case 'emergency_referral': return 'red';
  }
}

// ── Build EngineInput from Assessment ─────────────────────────────────────

function buildEngineInput(assessment: Assessment): EngineInput {
  const movement = assessment.movementAssessment;
  const load = assessment.loadTest;
  const reassess = assessment.reassessment;
  const symptoms = assessment.symptomContext;

  return {
    safety: assessment.safetyScreen ?? { selectedFlags: [], hasUrgentFlag: false },
    symptoms: symptoms
      ? {
          numbnessTingling: symptoms.numbnessTingling,
          instability: symptoms.instability,
          locking: symptoms.locking,
          trend: symptoms.trend,
        }
      : undefined,
    movement: movement
      ? {
          rangeStatus: movement.rangeStatus as any,
          taskRangeAccess: movement.taskRangeAccess,
          repeatedMovementResponse: movement.repeatedMovementResponse as any,
        }
      : undefined,
    load: load
      ? {
          forceProduction: load.forceProduction,
          movementQuality: load.movementQuality,
          symptomBehavior: load.symptomBehavior,
          stabilityConfidence: load.stabilityConfidence,
          stoppedEarly: load.stoppedEarly,
          // Legacy fallbacks
          strengthResponse: load.strengthResponse,
          compensationPresent: load.compensationPresent,
          symptomResponse: load.symptomResponse,
          stabilityResponse: load.stabilityResponse,
        }
      : undefined,
    reassess: reassess
      ? {
          rangeResponse: reassess.rangeResponse,
          strengthResponse: reassess.strengthResponse,
          confidenceResponse: reassess.confidenceResponse,
          symptomsResponse: reassess.symptomsResponse,
          movementQualityResponse: reassess.movementQualityResponse,
          postLoadOverall: reassess.postLoadOverall,
          overallResponse: reassess.overallResponse,
        }
      : undefined,
  };
}

// ── Main classification function ───────────────────────────────────────────

/**
 * Determine participation classification for an assessment.
 * Returns legacy ClassificationResult for backward compatibility.
 * The rich ParticipationDecision is also available via .participationDecision.
 */
export function determineClassification(assessment: Assessment): ClassificationResult {
  const input = buildEngineInput(assessment);
  const decision = classify(input);

  return {
    classification: participationToClassification(decision.classification),
    reasons: decision.reasons,
    participationDecision: decision,
  };
}

/**
 * Determine the full participation decision (new API — preferred for new code).
 */
export function determineParticipationDecision(assessment: Assessment): ParticipationDecision {
  const input = buildEngineInput(assessment);
  return classify(input);
}

// ── Session escalation ─────────────────────────────────────────────────────

/**
 * During-session escalation based on check-in findings.
 * Per spec: new red flags → immediately escalate to red (stop/refer level).
 * Functional deterioration → move up one level.
 */
export function escalateClassification(
  current: Classification,
  symptoms: string,
  rangeOfMotion: string,
  strength: string,
  newRedFlags: boolean,
): Classification {
  if (newRedFlags) return 'red';

  const deteriorated =
    symptoms === 'worsened' || rangeOfMotion === 'worsened' || strength === 'worsened';

  if (deteriorated) {
    const order: Classification[] = ['green', 'yellow', 'orange', 'red'];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }

  return current;
}

// ── Follow-up classification ───────────────────────────────────────────────

import { classifyFollowUpTrajectory } from '@/decision-engine';

/**
 * Classify a 24-hour follow-up response.
 * Updated to use trajectory-based rules (no arbitrary day thresholds).
 */
export function classifyFollowUp(data: {
  comparedToBefore: string;
  activityLimited: boolean;
  swelling: boolean;
  rangeOfMotion: string;
  strength: string;
  morningStiffness: boolean;
  symptomsAtRest?: string;
}): { nextDayResponse: string; recommendations: string[] } {
  const result = classifyFollowUpTrajectory({
    comparedToBefore: data.comparedToBefore as any,
    activityLimited: data.activityLimited,
    swelling: data.swelling,
    rangeOfMotion: data.rangeOfMotion as any,
    strength: data.strength as any,
    morningStiffness: data.morningStiffness,
    symptomsAtRest: data.symptomsAtRest as any,
  });
  return {
    nextDayResponse: result.nextDayResponse,
    recommendations: result.recommendations,
  };
}

// ── Classification display info (updated to spec language) ─────────────────

export const CLASSIFICATION_INFO: Record<
  Classification,
  {
    title: string;
    summary: string;
    stopConditions: string[];
    seekCare: string;
    iconName: string;
  }
> = {
  green: {
    title: 'Continue',
    summary:
      'No participation-limiting findings were identified during this check-in. The athlete maintained the movement and force required for the intended activity, and symptoms remained stable or improved as task demand increased. Gradually return toward planned training demand and continue monitoring.',
    stopConditions: [
      'Symptoms escalate during the session',
      'Function or movement capacity declines',
      'New instability, neurological symptoms, or safety findings appear',
    ],
    seekCare:
      'Seek sports medicine evaluation if symptoms worsen over the next 24\u201348 hours or do not return to baseline.',
    iconName: 'checkmark-circle',
  },
  yellow: {
    title: 'Modify Today\u2019s Training',
    summary:
      'The athlete retains useful movement and force, but current capacity appears below today\u2019s planned training demand. Reduce the relevant training stress while maintaining tolerable participation.',
    stopConditions: [
      'Symptoms clearly worsen during the session',
      'Movement quality noticeably declines',
      'Any new safety finding appears',
    ],
    seekCare:
      'Seek sports medicine evaluation if symptoms persist or worsen with continued training.',
    iconName: 'options-outline',
  },
  orange: {
    title: 'Change Today\u2019s Session Goal',
    summary:
      'The athlete has a meaningful reduction in the capacity required for today\u2019s planned activity. Today\u2019s priority should shift away from performance development for the affected movement or region. Reduce or remove the provocative demand \u2014 appropriate unaffected training may continue.',
    stopConditions: [
      'Any increase in symptoms during activity',
      'Any decline in function or movement quality',
      'Any new neurological symptom',
    ],
    seekCare:
      'Consider sports medicine evaluation \u2014 especially if the limitation persists, has recurred, or if function remains restricted.',
    iconName: 'swap-horizontal-outline',
  },
  red: {
    title: 'Stop and Seek Evaluation',
    summary:
      'Today\u2019s response suggests that continued loading of the affected activity is not appropriate. The athlete should receive a professional sports medicine evaluation before progressing the affected activity. This does not necessarily mean an emergency is present.',
    stopConditions: [
      'Do not continue loading the affected area',
      'Do not perform further self-testing on the affected area',
    ],
    seekCare:
      'Seek sports medicine evaluation. For urgent or emergency findings, seek immediate medical care or call emergency services if needed.',
    iconName: 'close-circle',
  },
};
