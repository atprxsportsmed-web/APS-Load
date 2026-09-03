import type { ParticipationClassification, ReferralLevel } from './types';

/**
 * Determine the appropriate level of care based on classification.
 *
 * Per spec: Recommend LEVEL OF CARE, not a specific profession.
 * Future versions may map location + level → available providers.
 *
 * Levels:
 *   none             — No referral needed at this time
 *   sports_medicine  — Routine sports medicine / musculoskeletal evaluation
 *   urgent_medical   — Prompt / urgent medical or orthopedic evaluation
 *   emergency        — Emergency medical evaluation (call emergency services)
 */
export function determineReferralLevel(
  classification: ParticipationClassification,
  triggeredRules: string[],
): ReferralLevel {
  switch (classification) {
    case 'emergency_referral':
      return 'emergency';
    case 'urgent_referral':
      return 'urgent_medical';
    case 'stop_refer':
      // Neurologic, instability, or locking → prompt evaluation
      if (
        triggeredRules.includes('NEURO_SYMPTOM') ||
        triggeredRules.includes('INSTABILITY') ||
        triggeredRules.includes('LOCKING')
      ) {
        return 'urgent_medical';
      }
      return 'sports_medicine';
    case 'change_goal':
    case 'modify':
    case 'continue':
      return 'none';
  }
}

/**
 * Generate monitoring instructions appropriate for the classification.
 */
export function generateMonitoringInstructions(
  classification: ParticipationClassification,
): string[] {
  switch (classification) {
    case 'continue':
      return [
        'Monitor for symptom changes during the session.',
        'Stop and reassess if symptoms escalate, function declines, or new findings appear.',
        'Repeat the check-in before the next session if symptoms have not fully resolved.',
      ];
    case 'modify':
      return [
        'Monitor symptoms and function throughout the session.',
        'Stop if symptoms clearly worsen, movement quality deteriorates, or any new finding appears.',
        'Do not increase load or volume during this session.',
        'Reassess before the next training session.',
      ];
    case 'change_goal':
      return [
        'Avoid loading the affected area at or near the planned training demand.',
        'Stop immediately if symptoms or function worsen during any adapted activity.',
        'Consider sports medicine evaluation if this level of limitation persists.',
        'Reassess before the next training session.',
      ];
    case 'stop_refer':
      return [
        'Do not continue loading the affected area.',
        'Seek sports medicine evaluation before resuming the affected activity.',
        'Document current findings for the evaluating clinician.',
      ];
    case 'urgent_referral':
      return [
        'Do not continue training or loading the affected area.',
        'Seek prompt medical or sports medicine evaluation.',
        'Monitor for any worsening of the triggering finding.',
      ];
    case 'emergency_referral':
      return [
        'Stop all activity immediately.',
        'Call emergency services or transport to emergency care.',
        'Do not leave the athlete unattended.',
      ];
  }
}
