import type { MovementInput, SymptomInput } from './types';

export interface MovementRuleResult {
  /** Minimum classification level suggested by movement findings */
  minClassification: 'continue' | 'modify' | 'change_goal' | 'stop_refer';
  reasons: string[];
  triggeredRules: string[];
}

/**
 * Evaluate movement capacity and task-specific access.
 *
 * Key principle: The question is not "does the athlete have anatomically full ROM?"
 * but "can the athlete access the movement required for today's intended activity?"
 *
 * RULES:
 *   MOVE_UNABLE         — Cannot move at all → stop_refer
 *   MOVE_TASK_NO        — Cannot access task range → change_goal
 *   MOVE_TASK_PARTIAL   — Only partially accesses task range → change_goal
 *   MOVE_TASK_COMP      — Accesses task range with compensation → modify
 *   MOVE_CLEARLY_RED    — Clearly reduced availability → change_goal (if task range also impaired)
 *   MOVE_MILDLY_RED     — Mildly reduced availability → modify
 *   MOVE_WORSENS        — Symptoms progressively worsen with repeated movement → modify
 *   NEURO_SYMPTOM       — Neurologic symptoms in symptom context → stop_refer
 *   INSTABILITY         — Instability in symptom context → stop_refer
 *   LOCKING             — Locking in symptom context → stop_refer
 */
export function evaluateMovement(
  movement?: MovementInput,
  symptoms?: SymptomInput,
): MovementRuleResult {
  const reasons: string[] = [];
  const rules: string[] = [];
  let level: 'continue' | 'modify' | 'change_goal' | 'stop_refer' = 'continue';

  const escalate = (to: typeof level) => {
    const order = { continue: 0, modify: 1, change_goal: 2, stop_refer: 3 };
    if (order[to] > order[level]) level = to;
  };

  // ── Neurologic / structural symptoms ──────────────────────────────────────
  // (Note: if these were flagged in the safety screen, the safety override
  // already fired. This catches the same symptoms reported in symptom context.)
  if (symptoms?.numbnessTingling) {
    reasons.push('Numbness or tingling is present — a neurological symptom that warrants evaluation before loaded training.');
    rules.push('NEURO_SYMPTOM');
    escalate('stop_refer');
  }
  if (symptoms?.instability) {
    reasons.push('Instability or giving-way was reported. Loading an unstable structure exceeds the scope of a coach-directed decision.');
    rules.push('INSTABILITY');
    escalate('stop_refer');
  }
  if (symptoms?.locking) {
    reasons.push('Mechanical locking was reported — this warrants evaluation before continued loading.');
    rules.push('LOCKING');
    escalate('stop_refer');
  }

  if (!movement) return { minClassification: level, reasons, triggeredRules: rules };

  // ── Range availability ────────────────────────────────────────────────────
  if (movement.rangeStatus === 'unable') {
    reasons.push('The athlete cannot actively move the affected area.');
    rules.push('MOVE_UNABLE');
    escalate('stop_refer');
  } else if (movement.rangeStatus === 'clearly_reduced') {
    // Only escalates if task access is also impaired
    if (!movement.taskRangeAccess || movement.taskRangeAccess === 'no' || movement.taskRangeAccess === 'only_partially') {
      reasons.push('Active movement is clearly reduced and the movement required for today\'s activity is not fully accessible.');
      rules.push('MOVE_CLEARLY_RED');
      escalate('change_goal');
    } else {
      reasons.push('Active movement availability is clearly reduced.');
      rules.push('MOVE_CLEARLY_RED');
      escalate('modify');
    }
  } else if (movement.rangeStatus === 'mildly_reduced') {
    reasons.push('Active movement availability is mildly reduced.');
    rules.push('MOVE_MILDLY_RED');
    escalate('modify');
  }

  // ── Task-specific access ──────────────────────────────────────────────────
  if (movement.taskRangeAccess === 'no') {
    reasons.push('The athlete cannot access the movement required for today\'s intended activity.');
    rules.push('MOVE_TASK_NO');
    escalate('change_goal');
  } else if (movement.taskRangeAccess === 'only_partially') {
    reasons.push('The athlete can only partially access the movement required for today\'s activity.');
    rules.push('MOVE_TASK_PARTIAL');
    escalate('change_goal');
  } else if (movement.taskRangeAccess === 'yes_with_compensation') {
    reasons.push('The athlete accesses the required movement range, but uses compensation to do so.');
    rules.push('MOVE_TASK_COMP');
    escalate('modify');
  }
  // 'yes_normally' and 'yes_mild_symptoms' do not drive escalation by themselves

  // ── Repeated movement response ────────────────────────────────────────────
  const resp = movement.repeatedMovementResponse;
  const worsens = resp === 'progressively_worsens' || resp === 'worsened';
  if (worsens) {
    reasons.push('Repeated active movement caused symptoms to progressively worsen.');
    rules.push('MOVE_WORSENS');
    escalate('modify');
  }

  return { minClassification: level, reasons, triggeredRules: rules };
}
