import type { ParticipationClassification, EngineInput } from './types';

/**
 * Generate 1-3 plain-language sentences explaining the recommendation.
 * Goal: coaches gradually internalize good participation decision-making.
 *
 * Per spec: Do NOT include clinical jargon. Do NOT overwhelm with citations.
 * Evidence can appear behind expandable "Why?" / "Learn more" elements.
 */
export function generateExplanation(
  classification: ParticipationClassification,
  triggeredRules: string[],
  input: EngineInput,
): string {
  const hasForceIssue =
    triggeredRules.some(r => r.startsWith('FORCE_'));
  const hasMoveIssue =
    triggeredRules.some(r => r.startsWith('MOVE_'));
  const hasQualityIssue =
    triggeredRules.some(r => r.startsWith('QUALITY_'));
  const hasSymptomWorsening =
    triggeredRules.includes('SYMPTOM_WORSENING');
  const hasPostLoadWorse =
    triggeredRules.some(r => r.startsWith('POSTLOAD_'));
  const hasStabilityIssue =
    triggeredRules.some(r => r.startsWith('STABILITY_'));
  const hasNeuro =
    triggeredRules.includes('NEURO_SYMPTOM');
  const hasInstability =
    triggeredRules.includes('INSTABILITY') || triggeredRules.includes('LOCKING');

  switch (classification) {
    case 'continue':
      return (
        `Your athlete maintained the movement and force required for today${`'`}s activity, ` +
        `and symptoms remained stable or improved as demand increased. ` +
        `No participation-limiting findings were identified during this check-in. ` +
        `Gradually return toward planned training demand and continue monitoring — ` +
        `stop and reassess if function or symptoms meaningfully change.`
      );

    case 'modify': {
      const drivers: string[] = [];
      if (hasForceIssue) drivers.push('force production');
      if (hasMoveIssue) drivers.push('movement availability');
      if (hasQualityIssue) drivers.push('movement quality');
      if (hasSymptomWorsening) drivers.push('symptom response to increasing demand');
      if (hasStabilityIssue) drivers.push('movement stability');
      const driverText = drivers.length > 0
        ? drivers.join(' and ')
        : 'one or more functional factors';
      return (
        `Your athlete can still perform the movement, but there are mild limitations in ${driverText}. ` +
        `Reducing today${`'`}s training demand allows continued participation without repeatedly exceeding current capacity. ` +
        `Reassess if symptoms or function meaningfully worsen during the session.`
      );
    }

    case 'change_goal': {
      const drivers: string[] = [];
      if (hasForceIssue) drivers.push('force production is clearly reduced');
      if (hasMoveIssue) drivers.push('the required movement is not fully accessible');
      if (hasQualityIssue) drivers.push('clear compensation was observed');
      if (hasPostLoadWorse) drivers.push('function declined after the load check');
      if (hasStabilityIssue) drivers.push('movement stability is clearly impaired');
      const driverText = drivers.length > 0
        ? drivers.join(', and ')
        : 'meaningful functional capacity is reduced';
      return (
        `${driverText.charAt(0).toUpperCase() + driverText.slice(1)} — ` +
        `today${`'`}s planned training demand exceeds what the athlete can currently tolerate for the affected area. ` +
        `Shifting the session priority away from performance development for this movement protects against loading a system ` +
        `that is not currently responding well. Appropriate unaffected training may continue.`
      );
    }

    case 'stop_refer': {
      if (hasNeuro) {
        return (
          `A neurological symptom (numbness or tingling) is present. ` +
          `Loading an area with neurological involvement falls outside the scope of a coach-directed participation decision. ` +
          `A sports medicine evaluation is recommended before resuming loaded training for the affected area.`
        );
      }
      if (hasInstability) {
        return (
          `Instability or a mechanical finding (locking) was reported. ` +
          `These findings exceed what a coach-directed participation tool should manage without professional evaluation. ` +
          `A sports medicine evaluation is recommended before resuming loaded training.`
        );
      }
      return (
        `Today${`'`}s response suggests that continued loading of the affected area is not appropriate. ` +
        `One or more findings — including ${hasForceIssue ? 'inability to produce adequate force' : hasPostLoadWorse ? 'function declining after loading' : 'progressive functional deterioration'} — ` +
        `indicate this presentation exceeds what a training modification can safely manage. ` +
        `A sports medicine evaluation is recommended before progressing the affected activity.`
      );
    }

    case 'urgent_referral':
      return (
        `One or more findings during the safety screen suggest this athlete should be evaluated by a medical professional before returning to training. ` +
        `These findings fall outside the scope of a coach-directed participation decision. ` +
        `Seek sports medicine or urgent medical evaluation as appropriate — do not continue loading the affected area.`
      );

    case 'emergency_referral':
      return (
        `One or more findings during the safety screen suggest this athlete needs immediate emergency medical evaluation. ` +
        `Stop all activity immediately. ` +
        `Call emergency services or transport to emergency care — do not attempt to continue the assessment or training.`
      );
  }
}
