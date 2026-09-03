import type { SafetyInput, ParticipationDecision } from './types';

// Flags that warrant EMERGENCY evaluation (life-threatening or neurologically catastrophic)
const EMERGENCY_FLAG_IDS = new Set([
  'chest_pain',
  'breathing_difficulty',
  'fainting_dizziness',
  'saddle_numbness',
  'bowel_bladder',
  'confusion_after_impact',
  'severe_headache',
  'believes_emergency',
]);

/**
 * Evaluates the safety screen. If any urgent/emergency flag is selected,
 * returns the appropriate override decision and halts normal workflow.
 * Returns null if no safety trigger is present.
 *
 * RULE ID: SAFETY_EMERGENCY, SAFETY_URGENT
 */
export function evaluateSafetyScreen(
  safety: SafetyInput,
): Pick<ParticipationDecision, 'classification' | 'reasons' | 'triggeredRules' | 'referralLevel' | 'educationalExplanation'> | null {
  if (!safety.hasUrgentFlag || safety.selectedFlags.length === 0) return null;

  const hasEmergency = safety.selectedFlags.some(id => EMERGENCY_FLAG_IDS.has(id));

  if (hasEmergency) {
    const emergencyFlags = safety.selectedFlags
      .filter(id => EMERGENCY_FLAG_IDS.has(id))
      .join(', ');
    return {
      classification: 'emergency_referral',
      reasons: [
        `One or more findings require immediate emergency medical evaluation: ${emergencyFlags}.`,
        'Do not continue any loading or self-testing.',
        'Seek emergency medical care immediately. Call emergency services if needed.',
      ],
      triggeredRules: ['SAFETY_EMERGENCY'],
      referralLevel: 'emergency',
      educationalExplanation:
        'One or more findings during the safety screen suggest this athlete needs immediate emergency medical evaluation. Stop all activity and seek emergency services immediately. Do not attempt to continue the assessment.',
    };
  }

  // Urgent (serious but not necessarily life-threatening emergency)
  return {
    classification: 'urgent_referral',
    reasons: [
      'One or more findings during the safety screen suggest this athlete needs prompt medical evaluation.',
      'Do not continue with loading or the normal participation assessment.',
      'Seek sports medicine or urgent medical evaluation.',
    ],
    triggeredRules: ['SAFETY_URGENT'],
    referralLevel: 'urgent_medical',
    educationalExplanation:
      'One or more findings during the safety screen suggest this athlete should be evaluated by a medical professional before returning to training. These findings fall outside the scope of a coach-directed participation decision. Seek sports medicine or urgent medical evaluation as appropriate.',
  };
}

/**
 * Expose which flags are emergency vs urgent for UI differentiation.
 */
export function classifyFlag(flagId: string): 'emergency' | 'urgent' {
  return EMERGENCY_FLAG_IDS.has(flagId) ? 'emergency' : 'urgent';
}
