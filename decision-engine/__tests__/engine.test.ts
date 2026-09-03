// ATPRX Decision Engine — automated test suite
// Covers 14 key scenarios from the product specification.
//
// Run with: node --experimental-vm-modules decision-engine/__tests__/engine.test.js
// Or compile first: npx tsc --outDir dist && node dist/decision-engine/__tests__/engine.test.js

import { classify } from '../index';
import type { EngineInput } from '../types';

type Result = ReturnType<typeof classify>;

let passed = 0;
let failed = 0;

function test(name: string, input: EngineInput, assertions: (r: Result) => void): void {
  try {
    const result = classify(input);
    assertions(result);
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name}`);
    console.error(`    ${msg}`);
    failed++;
  }
}

function assert<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`[${label}] Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(arr: string[], item: string, label: string): void {
  if (!arr.includes(item)) {
    throw new Error(`[${label}] Expected array to contain ${JSON.stringify(item)}, got [${arr.join(', ')}]`);
  }
}

function assertNotEquals<T>(actual: T, unexpected: T, label: string): void {
  if (actual === unexpected) {
    throw new Error(`[${label}] Expected NOT ${JSON.stringify(unexpected)}, but got it`);
  }
}

const NO_SAFETY: EngineInput['safety'] = { selectedFlags: [], hasUrgentFlag: false };

console.log('\nATRPX Decision Engine Tests\n');

// ── 1. All functional parameters normal → CONTINUE ────────────────────────
test('All normal → CONTINUE', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'continue', 'classification');
  assert(r.referralLevel, 'none', 'referralLevel');
});

// ── 2. Force mildly reduced → MODIFY ─────────────────────────────────────
test('Force mildly reduced → MODIFY', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'mildly_reduced', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'modify', 'classification');
  assertContains(r.triggeredRules, 'FORCE_MILD', 'triggeredRules');
  assert(r.recommendedModifications.intensity, true, 'mods.intensity');
  assert(r.recommendedModifications.volume, true, 'mods.volume');
});

// ── 3. Force clearly reduced → CHANGE_GOAL minimum ───────────────────────
test('Force clearly reduced → CHANGE_GOAL', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'clearly_reduced', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'change_goal', 'classification');
  assertContains(r.triggeredRules, 'FORCE_CLEARLY', 'triggeredRules');
});

// ── 4. Force unable → STOP/REFER ─────────────────────────────────────────
test('Force unable → STOP_REFER', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'unable', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'stop_refer', 'classification');
  assertContains(r.triggeredRules, 'FORCE_UNABLE', 'triggeredRules');
  assert(r.referralLevel, 'sports_medicine', 'referralLevel');
});

// ── 5. Task range access = no → CHANGE_GOAL ──────────────────────────────
test('Task range access = no → CHANGE_GOAL', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'mildly_reduced', taskRangeAccess: 'no', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'change_goal', 'classification');
  assertContains(r.triggeredRules, 'MOVE_TASK_NO', 'triggeredRules');
});

// ── 6. Clear compensation during load → CHANGE_GOAL ─────────────────────
test('Clear compensation → CHANGE_GOAL', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'clear_compensation', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'change_goal', 'classification');
  assertContains(r.triggeredRules, 'QUALITY_CLEAR_COMP', 'triggeredRules');
});

// ── 7. Stopped early while already change_goal → STOP_REFER ─────────────
test('Stopped early + change_goal finding → STOP_REFER', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'no', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: true },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'stop_refer', 'classification');
  assertContains(r.triggeredRules, 'STOPPED_EARLY', 'triggeredRules');
});

// ── 8. Both range + force worsened post-load → STOP_REFER ────────────────
test('Both range and force worsened post-load → STOP_REFER', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'worsened', strengthResponse: 'worsened', confidenceResponse: 'unchanged', postLoadOverall: 'worsened', overallResponse: 'clearly_worse' },
}, r => {
  assert(r.classification, 'stop_refer', 'classification');
  assertContains(r.triggeredRules, 'POSTLOAD_BOTH_WORSENED', 'triggeredRules');
});

// ── 9. Emergency safety flag → EMERGENCY_REFERRAL ────────────────────────
test('Emergency safety flag → EMERGENCY_REFERRAL', {
  safety: { selectedFlags: ['chest_pain'], hasUrgentFlag: true },
}, r => {
  assert(r.classification, 'emergency_referral', 'classification');
  assertContains(r.triggeredRules, 'SAFETY_EMERGENCY', 'triggeredRules');
  assert(r.referralLevel, 'emergency', 'referralLevel');
});

// ── 10. Urgent (non-emergency) safety flag → URGENT_REFERRAL ─────────────
test('Urgent safety flag → URGENT_REFERRAL', {
  safety: { selectedFlags: ['obvious_deformity'], hasUrgentFlag: true },
}, r => {
  assert(r.classification, 'urgent_referral', 'classification');
  assertContains(r.triggeredRules, 'SAFETY_URGENT', 'triggeredRules');
  assert(r.referralLevel, 'urgent_medical', 'referralLevel');
});

// ── 11. Numbness/tingling in symptom context → STOP_REFER ────────────────
test('Numbness/tingling in symptom context → STOP_REFER', {
  safety: NO_SAFETY,
  symptoms: { numbnessTingling: true },
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'stop_refer', 'classification');
  assertContains(r.triggeredRules, 'NEURO_SYMPTOM', 'triggeredRules');
  assert(r.referralLevel, 'urgent_medical', 'referralLevel');
});

// ── 12. Instability in symptom context → STOP_REFER ─────────────────────
test('Instability in symptom context → STOP_REFER', {
  safety: NO_SAFETY,
  symptoms: { instability: true },
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'stop_refer', 'classification');
  assertContains(r.triggeredRules, 'INSTABILITY', 'triggeredRules');
});

// ── 13. Progressive symptom worsening → MODIFY ───────────────────────────
test('Progressive symptom worsening → MODIFY', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'progressively_worsening', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'modify', 'classification');
  assertContains(r.triggeredRules, 'SYMPTOM_WORSENING', 'triggeredRules');
});

// ── 14. Mildly uncertain stability → MODIFY ──────────────────────────────
test('Mildly uncertain stability → MODIFY', {
  safety: NO_SAFETY,
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_normally', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'mildly_uncertain', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'modify', 'classification');
  assertContains(r.triggeredRules, 'STABILITY_UNCERTAIN', 'triggeredRules');
});

// ── Pain rule: pain alone never restricts ────────────────────────────────
test('PAIN RULE: symptoms present, all functional variables normal → CONTINUE', {
  safety: NO_SAFETY,
  symptoms: { trend: 'stable' },
  movement: { rangeStatus: 'full', taskRangeAccess: 'yes_mild_symptoms', repeatedMovementResponse: 'stable' },
  load: { forceProduction: 'expected', movementQuality: 'normal', symptomBehavior: 'stable', stabilityConfidence: 'normal', stoppedEarly: false },
  reassess: { rangeResponse: 'unchanged', strengthResponse: 'unchanged', confidenceResponse: 'unchanged', postLoadOverall: 'stable', overallResponse: 'unchanged' },
}, r => {
  assert(r.classification, 'continue', 'classification');
  assertNotEquals(r.recommendedModifications.intensity, true, 'no mods.intensity');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} test(s) failed`);
}
