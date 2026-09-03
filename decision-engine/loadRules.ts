import type { LoadInput, ReassessInput, ForceProduction, MovementQuality } from './types';

type Level = 'continue' | 'modify' | 'change_goal' | 'stop_refer';

export interface LoadRuleResult {
  minClassification: 'continue' | 'modify' | 'change_goal' | 'stop_refer';
  reasons: string[];
  triggeredRules: string[];
  recommendedModifications: {
    volume?: boolean;
    intensity?: boolean;
    velocity?: boolean;
    rangeOfMotion?: boolean;
    contact?: boolean;
    complexity?: boolean;
    fatigueExposure?: boolean;
  };
  /**
   * Whether the stopped-early rule fired. Used by classificationRules to
   * apply the compound rule: stoppedEarly + independent change_goal → stop_refer.
   */
  stoppedEarlyFired: boolean;
  /**
   * The classification level reached by load findings *before* stopped-early
   * was evaluated. Allows classificationRules to detect independent findings.
   */
  preStoppedEarlyClassification: 'continue' | 'modify' | 'change_goal' | 'stop_refer';
}

// ── Force Production Rule (explicit from spec) ─────────────────────────────
// NORMAL/EXPECTED → does not independently restrict participation
// MILDLY REDUCED   → MODIFY
// CLEARLY REDUCED  → CHANGE SESSION GOAL at minimum
// UNABLE           → STOP/REFER or higher

function evaluateForce(force: ForceProduction): {
  level: 'continue' | 'modify' | 'change_goal' | 'stop_refer';
  reason: string | null;
  rule: string | null;
  mods: LoadRuleResult['recommendedModifications'];
} {
  switch (force) {
    case 'expected':
      return { level: 'continue', reason: null, rule: null, mods: {} };
    case 'mildly_reduced':
      return {
        level: 'modify',
        reason: 'Force production is mildly reduced during the Controlled Load Check.',
        rule: 'FORCE_MILD',
        mods: { intensity: true, volume: true },
      };
    case 'clearly_reduced':
      return {
        level: 'change_goal',
        reason: 'Force production is clearly reduced. The athlete cannot generate the force required for today\'s planned activity.',
        rule: 'FORCE_CLEARLY',
        mods: { intensity: true, volume: true, velocity: true, fatigueExposure: true },
      };
    case 'unable':
      return {
        level: 'stop_refer',
        reason: 'The athlete cannot produce meaningful force in the affected area during the Controlled Load Check.',
        rule: 'FORCE_UNABLE',
        mods: {},
      };
  }
}

function evaluateMovementQuality(quality: MovementQuality): {
  level: 'continue' | 'modify' | 'change_goal' | 'stop_refer';
  reason: string | null;
  rule: string | null;
  mods: LoadRuleResult['recommendedModifications'];
} {
  switch (quality) {
    case 'normal':
      return { level: 'continue', reason: null, rule: null, mods: {} };
    case 'mild_compensation':
      return {
        level: 'modify',
        reason: 'Mild compensation was observed during the Controlled Load Check.',
        rule: 'QUALITY_MILD_COMP',
        mods: { complexity: true, intensity: true },
      };
    case 'clear_compensation':
      return {
        level: 'change_goal',
        reason: 'Clear compensation was observed during the Controlled Load Check — the athlete must alter their movement pattern to tolerate the load.',
        rule: 'QUALITY_CLEAR_COMP',
        mods: { intensity: true, velocity: true, rangeOfMotion: true, complexity: true, fatigueExposure: true },
      };
    case 'unable':
      return {
        level: 'stop_refer',
        reason: 'The athlete is unable to perform the required movement even with reduced demand.',
        rule: 'QUALITY_UNABLE',
        mods: {},
      };
  }
}

/**
 * Evaluate the Controlled Load Check and post-load Reassessment.
 *
 * Pain scores are collected for monitoring but do NOT determine classification
 * (per spec Pain Rule). Classification is driven by functional findings.
 *
 * RULES:
 *   FORCE_MILD, FORCE_CLEARLY, FORCE_UNABLE       — Force production rule
 *   QUALITY_MILD_COMP, QUALITY_CLEAR_COMP         — Movement quality rule
 *   QUALITY_UNABLE                                — Unable to perform movement
 *   STABILITY_UNSTABLE                            — Clearly unstable
 *   STABILITY_UNCERTAIN                           — Mildly uncertain stability
 *   SYMPTOM_WORSENING                             — Progressive symptom worsening under load
 *   STOPPED_EARLY                                 — Test stopped for escalation
 *   POSTLOAD_BOTH_WORSENED                        — ROM + force both worsened post-load
 *   POSTLOAD_WORSENED                             — Overall post-load worsening
 */
export function evaluateLoad(
  load?: LoadInput,
  reassess?: ReassessInput,
): LoadRuleResult {
  const reasons: string[] = [];
  const rules: string[] = [];
  let level: 'continue' | 'modify' | 'change_goal' | 'stop_refer' = 'continue';
  let mods: LoadRuleResult['recommendedModifications'] = {};

  const escalate = (to: typeof level) => {
    const order = { continue: 0, modify: 1, change_goal: 2, stop_refer: 3 };
    if (order[to] > order[level]) level = to;
  };

  const mergeMods = (m: typeof mods) => {
    Object.assign(mods, m);
  };

  if (!load) return { minClassification: level, reasons, triggeredRules: rules, recommendedModifications: mods, stoppedEarlyFired: false, preStoppedEarlyClassification: level };

  // ── Resolve force production (new field preferred, legacy fallback) ────────
  let force: ForceProduction | undefined = load.forceProduction;
  if (!force && load.strengthResponse) {
    const map: Record<string, ForceProduction> = {
      normal: 'expected',
      mildly_reduced: 'mildly_reduced',
      clearly_reduced: 'clearly_reduced',
    };
    force = map[load.strengthResponse];
  }

  if (force) {
    const r = evaluateForce(force);
    if (r.reason) reasons.push(r.reason);
    if (r.rule) rules.push(r.rule);
    escalate(r.level);
    mergeMods(r.mods);
  }

  // ── Movement quality ───────────────────────────────────────────────────────
  let quality: MovementQuality | undefined = load.movementQuality;
  if (!quality && load.compensationPresent !== undefined) {
    quality = load.compensationPresent ? 'clear_compensation' : 'normal';
  }

  if (quality) {
    const r = evaluateMovementQuality(quality);
    if (r.reason) reasons.push(r.reason);
    if (r.rule) rules.push(r.rule);
    escalate(r.level);
    mergeMods(r.mods);
  }

  // ── Stability / confidence ─────────────────────────────────────────────────
  const stability = load.stabilityConfidence;
  const legacyStability = load.stabilityResponse;
  const clearlyUnstable =
    stability === 'clearly_unstable' || legacyStability === 'unstable';
  const mildlyUncertain =
    stability === 'mildly_uncertain' || legacyStability === 'uncertain';

  if (clearlyUnstable) {
    reasons.push('Movement felt clearly unstable during the Controlled Load Check — the athlete could not confidently load the affected area.');
    rules.push('STABILITY_UNSTABLE');
    escalate('change_goal');
    mergeMods({ intensity: true, velocity: true, fatigueExposure: true });
  } else if (mildlyUncertain) {
    reasons.push('Movement stability felt mildly uncertain during the Controlled Load Check.');
    rules.push('STABILITY_UNCERTAIN');
    escalate('modify');
    mergeMods({ intensity: true, velocity: true });
  }

  // ── Symptom behavior ──────────────────────────────────────────────────────
  const sympBehavior = load.symptomBehavior;
  const legacySympResp = load.symptomResponse;
  const progressivelyWorsening =
    sympBehavior === 'progressively_worsening' || legacySympResp === 'worsened';

  if (progressivelyWorsening && (level as Level) !== 'stop_refer') {
    reasons.push('Symptoms progressively worsened as task demand increased during the Controlled Load Check.');
    rules.push('SYMPTOM_WORSENING');
    // Escalate to modify minimum; change_goal if combined with other factors
    const lvSnap = level as Level;
    if (lvSnap === 'change_goal' || lvSnap === 'stop_refer' || (force && force !== 'expected')) {
      escalate('change_goal');
      mergeMods({ intensity: true, volume: true, fatigueExposure: true });
    } else {
      escalate('modify');
      mergeMods({ intensity: true, volume: true });
    }
  }

  // ── Test stopped early ─────────────────────────────────────────────────────
  // Snapshot the level reached by load findings *before* stopped-early fires.
  // classificationRules uses this to apply the compound rule correctly:
  //   stoppedEarly + independent change_goal (from movement OR other load finding) → stop_refer
  //   stoppedEarly alone (no other change_goal finding anywhere) → change_goal
  let stoppedEarlyFired = false;
  const preStoppedEarlyClassification = level;

  if (load.stoppedEarly) {
    stoppedEarlyFired = true;
    reasons.push('The Controlled Load Check was stopped early due to symptom escalation.');
    rules.push('STOPPED_EARLY');
    // In isolaton: stopped early → change_goal at minimum.
    // Compound promotion to stop_refer is handled in classificationRules
    // using movement + preStoppedEarlyClassification to detect independent findings.
    escalate('change_goal');
  }

  // ── Post-load reassessment ─────────────────────────────────────────────────
  if (reassess) {
    const postLoad = reassess.postLoadOverall;
    const legacyOverall = reassess.overallResponse;
    const bothWorsened =
      reassess.rangeResponse === 'worsened' && reassess.strengthResponse === 'worsened';

    if (bothWorsened) {
      reasons.push('Both movement capacity and force production declined after the Controlled Load Check compared to before.');
      rules.push('POSTLOAD_BOTH_WORSENED');
      escalate('stop_refer');
    } else if (
      postLoad === 'worsened' ||
      legacyOverall === 'clearly_worse' ||
      legacyOverall === 'mildly_worse'
    ) {
      reasons.push('Overall function worsened after the Controlled Load Check.');
      rules.push('POSTLOAD_WORSENED');
      const isMildlyWorse = (legacyOverall as string) === 'mildly_worse';
      escalate(isMildlyWorse ? 'change_goal' : 'stop_refer');
    }
    // Stable or improved post-load: no escalation needed
  }

  return {
    minClassification: level,
    reasons,
    triggeredRules: rules,
    recommendedModifications: mods,
    stoppedEarlyFired,
    preStoppedEarlyClassification,
  };
}
