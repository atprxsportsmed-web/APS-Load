import type {
  EngineInput,
  ParticipationDecision,
  ParticipationClassification,
  RecommendedModifications,
} from './types';
import { evaluateSafetyScreen } from './safetyRules';
import { evaluateMovement } from './movementRules';
import { evaluateLoad } from './loadRules';
import { generateExplanation } from './explanationGenerator';
import { determineReferralLevel, generateMonitoringInstructions } from './referralRules';

type Level = 'continue' | 'modify' | 'change_goal' | 'stop_refer';

function levelOrder(l: Level): number {
  return { continue: 0, modify: 1, change_goal: 2, stop_refer: 3 }[l];
}

function maxLevel(a: Level, b: Level): Level {
  return levelOrder(a) >= levelOrder(b) ? a : b;
}

/**
 * Main classification function.
 *
 * Priority (highest wins):
 *   1. Emergency safety screen override
 *   2. Urgent safety screen override
 *   3. Normal workflow (movement → load → trajectory)
 *
 * Core principle: participation is the starting assumption.
 * Escalate only when functional findings warrant it.
 *
 * PAIN RULE (encoded explicitly per spec):
 *   Pain alone does NOT determine classification.
 *   Pain scores are collected for monitoring purposes only.
 *   Pain becomes relevant when accompanied by functional findings:
 *   force loss, movement loss, compensation, instability, neurologic symptoms,
 *   progressive worsening trajectory.
 */
export function classify(input: EngineInput): ParticipationDecision {
  const allReasons: string[] = [];
  const allRules: string[] = [];
  let mods: RecommendedModifications = {};

  // ── 1. Safety screen override ─────────────────────────────────────────────
  const safetyResult = evaluateSafetyScreen(input.safety);
  if (safetyResult) {
    return {
      ...safetyResult,
      recommendedModifications: {},
      monitoringInstructions: generateMonitoringInstructions(safetyResult.classification),
    };
  }

  // ── 2. Normal workflow ────────────────────────────────────────────────────
  let level: Level = 'continue';

  // Movement capacity evaluation
  const moveResult = evaluateMovement(input.movement, input.symptoms);
  if (moveResult.minClassification !== 'continue') {
    level = maxLevel(level, moveResult.minClassification);
  }
  for (const r of moveResult.reasons) allReasons.push(r);
  for (const r of moveResult.triggeredRules) allRules.push(r);

  // Controlled load check + reassessment
  const loadResult = evaluateLoad(input.load, input.reassess);
  if (loadResult.minClassification !== 'continue') {
    level = maxLevel(level, loadResult.minClassification);
  }
  for (const r of loadResult.reasons) allReasons.push(r);
  for (const r of loadResult.triggeredRules) allRules.push(r);
  const lrMods = loadResult.recommendedModifications;
  for (const k of Object.keys(lrMods) as (keyof typeof lrMods)[]) {
    (mods as Record<string, boolean>)[k] = true;
  }

  // ── Compound rule: stoppedEarly + independent change_goal finding → stop_refer ──
  // "Independent" means change_goal came from movement OR a load finding other than stopped-early.
  // stoppedEarly alone (nothing else at change_goal level) → stays at change_goal.
  //
  // We detect this by comparing against the level that existed BEFORE stopped-early fired:
  //   preStoppedEarlyLoadLevel   = load findings excluding stopped-early itself
  //   moveLevel                  = movement findings
  // If either independently reached change_goal, the compound rule applies.
  if (loadResult.stoppedEarlyFired) {
    const independentLevel = maxLevel(
      moveResult.minClassification,
      loadResult.preStoppedEarlyClassification,
    );
    if (levelOrder(independentLevel) >= levelOrder('change_goal')) {
      level = 'stop_refer';
      // STOPPED_EARLY rule ID already in allRules from loadResult
    }
  }

  // NOTE: Longitudinal trajectory escalation (TRAJ_* rules) is intentionally deferred.
  // evaluateTrajectory() exists and is tested, but buildEngineInput() in classificationEngine.ts
  // does not yet supply longitudinal data — the workflow for tracking consecutive sessions
  // is not yet built. Wiring this in without workflow support would leave the rule unreachable
  // and untestable in production. See task #10 or a dedicated trajectory-wiring task.

  // ── 3. Build classification ───────────────────────────────────────────────
  // Deduplicate (manual — avoids lib target issues with Set spread)
  const uniqueReasons: string[] = [];
  for (const r of allReasons) { if (uniqueReasons.indexOf(r) === -1) uniqueReasons.push(r); }
  const uniqueRules: string[] = [];
  for (const r of allRules) { if (uniqueRules.indexOf(r) === -1) uniqueRules.push(r); }

  // If no functional findings escalated above continue, report clean continue
  if (level === 'continue' && uniqueReasons.length === 0) {
    uniqueReasons.push(
      'The athlete maintained the movement and force required for today\'s intended activity.',
      'Symptoms remained stable or improved as task demand increased.',
      'No participation-limiting findings were identified during this check-in.',
    );
  }

  const classification: ParticipationClassification = level;
  const referralLevel = determineReferralLevel(classification, uniqueRules);
  const monitoringInstructions = generateMonitoringInstructions(classification);
  const educationalExplanation = generateExplanation(classification, uniqueRules, input);

  // Compute recommended modifications from classification + mods
  const recommendedModifications = computeModifications(classification, mods);

  return {
    classification,
    reasons: uniqueReasons,
    triggeredRules: uniqueRules,
    recommendedModifications,
    monitoringInstructions,
    referralLevel,
    educationalExplanation,
  };
}

function computeModifications(
  classification: ParticipationClassification,
  loadMods: RecommendedModifications,
): RecommendedModifications {
  if (classification === 'continue') return {};
  if (classification === 'stop_refer' || classification === 'urgent_referral' || classification === 'emergency_referral') {
    return {};
  }

  if (classification === 'modify') {
    // At minimum: intensity and volume
    return {
      intensity: true,
      volume: true,
      ...loadMods,
    };
  }

  if (classification === 'change_goal') {
    // Broader demand reduction
    return {
      intensity: true,
      volume: true,
      velocity: true,
      fatigueExposure: true,
      ...loadMods,
    };
  }

  return loadMods;
}
