import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAssessment } from '@/context/AssessmentContext';
import { ProgressBar } from '@/components/ProgressBar';
import type { ForceProduction, MovementQuality, SymptomBehavior, StabilityConfidence } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

// ── Option picker component ────────────────────────────────────────────────

function DomainPicker<T extends string>({
  label,
  sublabel,
  options,
  value,
  onChange,
  testIdPrefix,
}: {
  label: string;
  sublabel?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  testIdPrefix: string;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      {sublabel && (
        <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>
      )}
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
            activeOpacity={0.7}
            style={[
              styles.optRow,
              {
                backgroundColor: selected ? colors.secondary : colors.card,
                borderColor: selected ? colors.accent : colors.border,
                borderWidth: selected ? 2 : 1,
                borderRadius: colors.radius,
              },
            ]}
            testID={`${testIdPrefix}-${opt.value}`}
          >
            <Text style={[styles.optLabel, { color: selected ? colors.accent : colors.foreground }]}>
              {opt.label}
            </Text>
            <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : 'transparent' }]}>
              {selected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Pain tracker (monitoring only — does NOT drive classification) ──────────

function PainMonitor({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const colors = useColors();
  const getColor = (n: number) => {
    if (n === 0) return colors.green;
    if (n <= 3) return colors.green;
    if (n <= 5) return colors.yellow;
    if (n <= 7) return colors.orange;
    return colors.red;
  };
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.painRow}>
        {Array.from({ length: 11 }, (_, i) => {
          const sel = value === i;
          const c = getColor(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => { Haptics.selectionAsync(); onChange(i); }}
              activeOpacity={0.7}
              style={[
                styles.painBtn,
                {
                  backgroundColor: sel ? c : colors.card,
                  borderColor: sel ? c : colors.border,
                  borderRadius: 4,
                },
              ]}
              testID={`pain-${label.replace(/\s+/g, '-').toLowerCase()}-${i}`}
            >
              <Text style={[styles.painText, { color: sel ? '#FFFFFF' : colors.foreground }]}>{i}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Domain options ─────────────────────────────────────────────────────────

const FORCE_OPTIONS: { value: ForceProduction; label: string }[] = [
  { value: 'expected', label: 'Expected — full force available for the task' },
  { value: 'mildly_reduced', label: 'Mildly reduced — noticeable but athlete can still push' },
  { value: 'clearly_reduced', label: 'Clearly reduced — significantly less than expected' },
  { value: 'unable', label: 'Unable — cannot produce meaningful force for the task' },
];

const QUALITY_OPTIONS: { value: MovementQuality; label: string }[] = [
  { value: 'normal', label: 'Normal — technique unchanged' },
  { value: 'mild_compensation', label: 'Mild compensation — slight technique alteration' },
  { value: 'clear_compensation', label: 'Clear compensation — must meaningfully alter technique' },
  { value: 'unable', label: 'Unable — cannot perform even with modification' },
];

const BEHAVIOR_OPTIONS: { value: SymptomBehavior; label: string }[] = [
  { value: 'improving', label: 'Improving — symptoms decrease as demand increases' },
  { value: 'stable', label: 'Stable — symptoms unchanged as demand increases' },
  { value: 'progressively_worsening', label: 'Progressively worsening — symptoms increase with demand' },
];

const STABILITY_OPTIONS: { value: StabilityConfidence; label: string }[] = [
  { value: 'normal', label: 'Normal — movement feels controlled and confident' },
  { value: 'mildly_uncertain', label: 'Mildly uncertain — slight hesitancy loading the area' },
  { value: 'clearly_unstable', label: 'Clearly unstable — cannot confidently load the affected area' },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function LoadTestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();

  const [painBefore, setPainBefore] = useState(0);
  const [painDuring, setPainDuring] = useState(0);
  const [painAfter, setPainAfter] = useState(0);
  const [forceProduction, setForceProduction] = useState<ForceProduction | null>(null);
  const [movementQuality, setMovementQuality] = useState<MovementQuality | null>(null);
  const [symptomBehavior, setSymptomBehavior] = useState<SymptomBehavior | null>(null);
  const [stabilityConfidence, setStabilityConfidence] = useState<StabilityConfidence | null>(null);
  const [stoppedEarly, setStoppedEarly] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canContinue =
    forceProduction !== null &&
    movementQuality !== null &&
    symptomBehavior !== null &&
    stabilityConfidence !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Map new domain fields back to legacy fields for backward compat storage
    const strengthMap: Record<ForceProduction, 'normal' | 'mildly_reduced' | 'clearly_reduced'> = {
      expected: 'normal',
      mildly_reduced: 'mildly_reduced',
      clearly_reduced: 'clearly_reduced',
      unable: 'clearly_reduced',
    };
    const stabilityMap: Record<StabilityConfidence, 'stable' | 'uncertain' | 'unstable'> = {
      normal: 'stable',
      mildly_uncertain: 'uncertain',
      clearly_unstable: 'unstable',
    };
    const symptomMap: Record<SymptomBehavior, 'improved' | 'unchanged' | 'worsened'> = {
      improving: 'improved',
      stable: 'unchanged',
      progressively_worsening: 'worsened',
    };

    ctx.setLoadTestData({
      testDescription: 'Controlled Load Check',
      painBefore,
      painDuring,
      painAfter,
      // New 5-domain fields
      forceProduction: forceProduction!,
      movementQuality: movementQuality!,
      symptomBehavior: symptomBehavior!,
      stabilityConfidence: stabilityConfidence!,
      stoppedEarly,
      // Legacy fields (backward compat)
      strengthResponse: strengthMap[forceProduction!],
      stabilityResponse: stabilityMap[stabilityConfidence!],
      compensationPresent: movementQuality !== 'normal',
      symptomResponse: symptomMap[symptomBehavior!],
    });
    router.push('/assessment/reassessment');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Controlled Load Check</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={4} totalSteps={6} label="Step 4 of 6 — Controlled Load Check" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Framing */}
        <View style={[styles.frameBox, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.frameTitle, { color: colors.foreground }]}>Scaled version of the intended activity</Text>
          <Text style={[styles.frameBody, { color: colors.mutedForeground }]}>
            Choose a lower-demand version of today's planned movement. The goal is to observe how symptoms and function respond as task demand gradually increases — not to test maximum capacity.
          </Text>
          <Text style={[styles.frameBody, { color: colors.mutedForeground, marginTop: 6 }]}>
            Examples: lighter load, shorter range, slower tempo, supported variation, isometric position, or bodyweight version of the intended movement.
          </Text>
        </View>

        {/* Stopped early toggle */}
        <View style={[styles.stoppedRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.fieldLabel, { color: colors.foreground, flex: 1 }]}>
            Was the load check stopped early due to escalating symptoms?
          </Text>
          <View style={styles.stoppedBtns}>
            {([true, false] as const).map(val => {
              const sel = stoppedEarly === val;
              return (
                <TouchableOpacity
                  key={String(val)}
                  onPress={() => { Haptics.selectionAsync(); setStoppedEarly(val); }}
                  style={[
                    styles.stoppedBtn,
                    {
                      backgroundColor: sel ? (val ? colors.redBg : colors.secondary) : 'transparent',
                      borderColor: sel ? (val ? colors.red : colors.accent) : colors.border,
                      borderRadius: 6,
                    },
                  ]}
                  testID={`stopped-${val}`}
                >
                  <Text style={[styles.stoppedBtnText, { color: sel ? (val ? colors.red : colors.accent) : colors.mutedForeground }]}>
                    {val ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pain monitoring */}
        <View style={[styles.painSection, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.painHeader}>
            <Ionicons name="analytics-outline" size={16} color={colors.accent} />
            <Text style={[styles.painTitle, { color: colors.foreground }]}>Pain monitoring (0–10)</Text>
          </View>
          <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>
            Collected for monitoring only. Pain scores alone do not determine the participation recommendation.
          </Text>
          <PainMonitor value={painBefore} onChange={setPainBefore} label="Before" />
          <PainMonitor value={painDuring} onChange={setPainDuring} label="During" />
          <PainMonitor value={painAfter} onChange={setPainAfter} label="After" />
        </View>

        {/* Domain 1: Force Production */}
        <DomainPicker
          label="1. Force Production"
          sublabel="How much force can the athlete generate for the intended task?"
          options={FORCE_OPTIONS}
          value={forceProduction}
          onChange={setForceProduction}
          testIdPrefix="force"
        />

        {/* Domain 2: Movement Quality */}
        <DomainPicker
          label="2. Movement Quality"
          sublabel="How is the athlete's technique during the load check?"
          options={QUALITY_OPTIONS}
          value={movementQuality}
          onChange={setMovementQuality}
          testIdPrefix="quality"
        />

        {/* Domain 3: Symptom Behavior */}
        <DomainPicker
          label="3. Symptom Behavior"
          sublabel="What happens to symptoms as task demand progressively increases?"
          options={BEHAVIOR_OPTIONS}
          value={symptomBehavior}
          onChange={setSymptomBehavior}
          testIdPrefix="behavior"
        />

        {/* Domain 4: Stability / Confidence */}
        <DomainPicker
          label="4. Stability / Confidence"
          sublabel="Can the athlete confidently load the affected area?"
          options={STABILITY_OPTIONS}
          value={stabilityConfidence}
          onChange={setStabilityConfidence}
          testIdPrefix="stability"
        />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[styles.continueBtn, { backgroundColor: canContinue ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="load-test-continue-btn"
        >
          <Text style={[styles.continueBtnText, { color: canContinue ? colors.primaryForeground : colors.mutedForeground }]}>
            Continue
          </Text>
          <Ionicons name="arrow-forward" size={20} color={canContinue ? colors.primaryForeground : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  frameBox: { padding: 16, borderWidth: 1, gap: 6 },
  frameTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  frameBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  fieldLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sublabel: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -4 },
  stoppedRow: { padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stoppedBtns: { flexDirection: 'row', gap: 8 },
  stoppedBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  stoppedBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  painSection: { padding: 16, borderWidth: 1, gap: 12 },
  painHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  painTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  painRow: { flexDirection: 'row', gap: 3 },
  painBtn: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  painText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  optRow: { padding: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
