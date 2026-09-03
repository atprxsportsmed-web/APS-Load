import type { LongitudinalInput, ParticipationClassification } from './types';

export interface TrajectoryResult {
  /** Whether trajectory alone warrants referral escalation */
  shouldEscalate: boolean;
  /** Trajectory-based recommendation adjustment */
  trajectoryClassification: 'better' | 'back_to_baseline' | 'mildly_worse' | 'clearly_worse' | null;
  reasons: string[];
  triggeredRules: string[];
  referralRecommended: boolean;
}

/**
 * Number of consecutive sessions without improvement before recommending
 * sports medicine evaluation. Configurable — not presented as a validated threshold.
 */
export const SESSIONS_WITHOUT_IMPROVEMENT_THRESHOLD = 3;

/**
 * Evaluate longitudinal trajectory.
 *
 * Per spec: Do NOT automatically refer based on arbitrary duration (e.g. "pain > 7 days").
 * Instead use repeated response trajectory across sessions.
 *
 * RULES:
 *   TRAJ_BETTER              — Better than previous baseline → cautious progression
 *   TRAJ_BASELINE            — Back to baseline → continue current progression
 *   TRAJ_MILDLY_WORSE        — Mildly worse without capacity loss → maintain or reduce
 *   TRAJ_CLEARLY_WORSE       — Clearly worse / new capacity loss → step down + consider referral
 *   TRAJ_REPEATED_FAILURE    — Repeated failure to improve → recommend evaluation
 */
export function evaluateTrajectory(longitudinal?: LongitudinalInput): TrajectoryResult {
  if (!longitudinal) {
    return {
      shouldEscalate: false,
      trajectoryClassification: null,
      reasons: [],
      triggeredRules: [],
      referralRecommended: false,
    };
  }

  const { trajectory, sessionsWithoutImprovement = 0 } = longitudinal;

  if (trajectory === 'better') {
    return {
      shouldEscalate: false,
      trajectoryClassification: 'better',
      reasons: ['The athlete is progressing better than their previous baseline.'],
      triggeredRules: ['TRAJ_BETTER'],
      referralRecommended: false,
    };
  }

  if (trajectory === 'back_to_baseline') {
    return {
      shouldEscalate: false,
      trajectoryClassification: 'back_to_baseline',
      reasons: ['The athlete has returned to their previous baseline.'],
      triggeredRules: ['TRAJ_BASELINE'],
      referralRecommended: false,
    };
  }

  if (trajectory === 'mildly_worse') {
    const repeatedFailure = sessionsWithoutImprovement >= SESSIONS_WITHOUT_IMPROVEMENT_THRESHOLD;
    return {
      shouldEscalate: repeatedFailure,
      trajectoryClassification: 'mildly_worse',
      reasons: repeatedFailure
        ? [
            `The athlete has not shown meaningful improvement over ${sessionsWithoutImprovement} consecutive sessions. A sports medicine evaluation is recommended.`,
          ]
        : ['Symptoms are mildly worse than the previous baseline, without meaningful capacity loss.'],
      triggeredRules: repeatedFailure ? ['TRAJ_REPEATED_FAILURE'] : ['TRAJ_MILDLY_WORSE'],
      referralRecommended: repeatedFailure,
    };
  }

  if (trajectory === 'clearly_worse') {
    return {
      shouldEscalate: true,
      trajectoryClassification: 'clearly_worse',
      reasons: [
        'The athlete is clearly worse than their previous baseline, with meaningful capacity loss. Step down participation and consider sports medicine evaluation.',
      ],
      triggeredRules: ['TRAJ_CLEARLY_WORSE'],
      referralRecommended: true,
    };
  }

  return {
    shouldEscalate: false,
    trajectoryClassification: null,
    reasons: [],
    triggeredRules: [],
    referralRecommended: false,
  };
}

/**
 * Classify a follow-up response for the 24-hour follow-up screen.
 * Returns a trajectory label and training guidance.
 *
 * Per spec: trajectory rules based on function, not arbitrary day counts.
 */
export function classifyFollowUpTrajectory(data: {
  comparedToBefore: 'better' | 'same' | 'worse';
  activityLimited: boolean;
  swelling: boolean;
  rangeOfMotion: 'improved' | 'unchanged' | 'worsened';
  strength: 'improved' | 'unchanged' | 'worsened';
  morningStiffness: boolean;
  symptomsAtRest?: 'none' | 'mild' | 'moderate' | 'significant';
}): {
  trajectory: 'better' | 'back_to_baseline' | 'mildly_worse' | 'clearly_worse';
  nextDayResponse: string;
  recommendations: string[];
  referralRecommended: boolean;
} {
  const clearlyWorse =
    data.comparedToBefore === 'worse' &&
    (data.rangeOfMotion === 'worsened' || data.strength === 'worsened' || data.activityLimited);

  const excessiveResponse =
    data.activityLimited ||
    (data.swelling && data.comparedToBefore !== 'better') ||
    data.symptomsAtRest === 'significant' ||
    data.symptomsAtRest === 'moderate';

  const mildResponse =
    data.morningStiffness ||
    data.comparedToBefore === 'same' ||
    data.symptomsAtRest === 'mild';

  if (clearlyWorse) {
    return {
      trajectory: 'clearly_worse',
      nextDayResponse: 'worsening',
      recommendations: [
        'Stop loading progression for the affected area.',
        'Seek sports medicine evaluation — function has declined rather than recovered.',
      ],
      referralRecommended: true,
    };
  }

  if (excessiveResponse) {
    return {
      trajectory: 'mildly_worse',
      nextDayResponse: 'excessive_response',
      recommendations: [
        'Reduce the next training exposure significantly.',
        'Use a more conservative variation or lower load demand.',
        'Consider sports medicine evaluation if this response repeats.',
      ],
      referralRecommended: false,
    };
  }

  if (mildResponse) {
    return {
      trajectory: 'back_to_baseline',
      nextDayResponse: 'mild_response',
      recommendations: [
        'Maintain or slightly reduce the previous training dose.',
        'Avoid increasing load and volume simultaneously.',
        'Repeat the check-in before the next session.',
      ],
      referralRecommended: false,
    };
  }

  return {
    trajectory: 'better',
    nextDayResponse: 'recovered',
    recommendations: [
      'Resume gradual progression toward planned training demand.',
      'Repeat the check-in before the next high-intensity session.',
    ],
    referralRecommended: false,
  };
}
