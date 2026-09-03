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
import { useHistory } from '@/context/HistoryContext';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { escalateClassification, determineClassification, CLASSIFICATION_INFO } from '@/services/classificationEngine';
import type { SessionTiming, SymptomResponse, Classification, Assessment } from '@/types/assessment';
import { generateId } from '@/services/storage';
import * as Haptics from 'expo-haptics';

const TIMING_OPTIONS: { value: SessionTiming; label: string; desc: string }[] = [
  { value: 'warmup', label: 'After warm-up', desc: 'Post warm-up check' },
  { value: 'first_set', label: 'After first working set', desc: 'Early in the session' },
  { value: 'halfway', label: 'Halfway through', desc: 'Mid-session check' },
  { value: 'post_session', label: 'Immediately after training', desc: 'Post-session' },
];

function ThreeWay({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SymptomResponse | null;
  onChange: (v: SymptomResponse) => void;
}) {
  const colors = useColors();
  const OPTS: { v: SymptomResponse; label: string; color: string }[] = [
    { v: 'improved', label: 'Better', color: colors.green },
    { v: 'unchanged', label: 'Same', color: colors.yellow },
    { v: 'worsened', label: 'Worse', color: colors.red },
  ];
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.threeRow}>
        {OPTS.map(o => {
          const sel = value === o.v;
          return (
            <TouchableOpacity
              key={o.v}
              onPress={() => { Haptics.selectionAsync(); onChange(o.v); }}
              activeOpacity={0.7}
              style={[
                styles.threeBtn,
                {
                  backgroundColor: sel ? o.color + '22' : colors.card,
                  borderColor: sel ? o.color : colors.border,
                  borderWidth: sel ? 2 : 1,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`checkin-${label.replace(/\s+/g, '-').toLowerCase()}-${o.v}`}
            >
              <Text style={[styles.threeBtnText, { color: sel ? o.color : colors.foreground }]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function SessionCheckinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();
  const { update, getById } = useHistory();

  const [timing, setTiming] = useState<SessionTiming | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomResponse | null>(null);
  const [rangeOfMotion, setRangeOfMotion] = useState<SymptomResponse | null>(null);
  const [strength, setStrength] = useState<SymptomResponse | null>(null);
  const [movementQuality, setMovementQuality] = useState<SymptomResponse | null>(null);
  const [newRedFlags, setNewRedFlags] = useState<boolean | null>(null);
  const [savedResult, setSavedResult] = useState<Classification | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canSave =
    timing !== null &&
    symptoms !== null &&
    rangeOfMotion !== null &&
    strength !== null &&
    movementQuality !== null &&
    newRedFlags !== null;

  // Get current classification
  const now = new Date().toISOString();
  const tempAssessment: Assessment = {
    id: ctx.assessmentId ?? 'unknown',
    createdAt: now,
    updatedAt: now,
    safetyScreen: ctx.safetyScreen ?? { selectedFlags: [], hasUrgentFlag: false },
    symptomContext: ctx.symptomContext ?? undefined,
    movementAssessment: ctx.movementData ?? undefined,
    loadTest: ctx.loadTestData ?? undefined,
    reassessment: ctx.reassessmentData ?? undefined,
    classification: 'green',
    classificationReasons: [],
    modifications: ctx.modifications,
    sessionCheckins: [],
  };
  const baseResult = determineClassification(tempAssessment);
  const baseClassification = baseResult.classification;

  const currentUpdated =
    canSave && symptoms && rangeOfMotion && strength && newRedFlags !== null
      ? escalateClassification(
          baseClassification,
          symptoms,
          rangeOfMotion,
          strength,
          newRedFlags,
        )
      : null;

  const handleSave = async () => {
    if (!canSave || !ctx.assessmentId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedClass = currentUpdated ?? baseClassification;
    const checkin = {
      id: generateId(),
      timing: timing!,
      createdAt: new Date().toISOString(),
      symptoms: symptoms!,
      rangeOfMotion: rangeOfMotion!,
      strength: strength!,
      movementQuality: movementQuality!,
      newRedFlags: newRedFlags!,
      updatedClassification: updatedClass,
    };

    const existing = getById(ctx.assessmentId);
    if (existing) {
      await update({
        ...existing,
        classification: updatedClass,
        sessionCheckins: [...existing.sessionCheckins, checkin],
        updatedAt: new Date().toISOString(),
      });
    }

    setSavedResult(updatedClass);
  };

  const RESULT_GUIDANCE: Record<Classification, string> = {
    green: `Continue with the session as planned. Monitor symptoms and stop if any new finding appears.`,
    yellow: `Continue but consider further reducing the training demand on the affected area. Reassess before increasing load.`,
    orange: `Switch to a lower-demand activity or stop loading the affected area. Do not push through declining function.`,
    red: `Stop training and seek sports medicine evaluation before progressing the affected activity.`,
  };

  if (savedResult) {
    const escalated = savedResult !== baseClassification;
    const info = CLASSIFICATION_INFO[savedResult];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Check-In Saved</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.resultContent, { paddingBottom: bottomPad + 20 }]}>
          <ClassificationBadge classification={savedResult} size="lg" />
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>{info.title}</Text>

          {escalated && (
            <View style={[styles.escalatedBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
              <Ionicons name="trending-up" size={18} color={colors.red} />
              <Text style={[styles.escalatedText, { color: colors.red }]}>
                Recommendation updated based on during-session findings.
              </Text>
            </View>
          )}

          <Text style={[styles.resultGuidance, { color: colors.mutedForeground }]}>
            {RESULT_GUIDANCE[savedResult]}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>During-Session Check-In</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current recommendation context */}
        <View style={[styles.currentBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>Pre-session recommendation</Text>
          <ClassificationBadge classification={baseClassification} size="md" />
          <Text style={[styles.currentHint, { color: colors.mutedForeground }]}>
            This check-in updates the recommendation based on how the session is going.
          </Text>
        </View>

        {/* When */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>When in the session?</Text>
        {TIMING_OPTIONS.map(opt => {
          const sel = timing === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { Haptics.selectionAsync(); setTiming(opt.value); }}
              activeOpacity={0.7}
              style={[
                styles.timingRow,
                {
                  backgroundColor: sel ? colors.secondary : colors.card,
                  borderColor: sel ? colors.accent : colors.border,
                  borderWidth: sel ? 2 : 1,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`timing-${opt.value}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.timingLabel, { color: sel ? colors.accent : colors.foreground }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.timingDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, { borderColor: sel ? colors.accent : colors.border, backgroundColor: sel ? colors.accent : 'transparent' }]}>
                {sel && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Functional findings */}
        <View style={[styles.domainsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Compared to the start of the session:
          </Text>
          <ThreeWay label="Symptoms" value={symptoms} onChange={setSymptoms} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThreeWay label="Movement range" value={rangeOfMotion} onChange={setRangeOfMotion} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThreeWay label="Force / strength" value={strength} onChange={setStrength} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThreeWay label="Movement quality" value={movementQuality} onChange={setMovementQuality} />
        </View>

        {/* New red flags */}
        <View style={[styles.redFlagCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Any new concerning findings since the pre-session check-in?
          </Text>
          <Text style={[styles.redFlagHint, { color: colors.mutedForeground }]}>
            New neurological symptoms, instability, or any safety finding from the safety screen.
          </Text>
          <View style={styles.yesNoRow}>
            {([false, true] as const).map(v => {
              const sel = newRedFlags === v;
              return (
                <TouchableOpacity
                  key={String(v)}
                  onPress={() => { Haptics.selectionAsync(); setNewRedFlags(v); }}
                  activeOpacity={0.7}
                  style={[
                    styles.yesNoBtn,
                    {
                      backgroundColor: sel ? (v ? colors.redBg : colors.greenBg) : colors.card,
                      borderColor: sel ? (v ? colors.red : colors.green) : colors.border,
                      borderWidth: sel ? 2 : 1,
                      borderRadius: colors.radius,
                    },
                  ]}
                  testID={`red-flags-${v}`}
                >
                  <Text style={[styles.yesNoText, { color: sel ? (v ? colors.red : colors.green) : colors.foreground }]}>
                    {v ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview updated recommendation */}
        {currentUpdated && currentUpdated !== baseClassification && (
          <View style={[styles.updatedPreview, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
            <Text style={[styles.updatedLabel, { color: colors.red }]}>Recommendation will update:</Text>
            <ClassificationBadge classification={currentUpdated} size="sm" />
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="save-checkin-btn"
        >
          <Text style={[styles.saveBtnText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
            Save Check-In
          </Text>
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
  doneBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  currentBox: { padding: 14, borderWidth: 1, gap: 8 },
  currentLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  currentHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  timingRow: { padding: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  timingLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  timingDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  domainsCard: { padding: 16, borderWidth: 1, gap: 0 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  divider: { height: 1, marginVertical: 10 },
  fieldLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  threeRow: { flexDirection: 'row', gap: 8 },
  threeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  threeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  redFlagCard: { padding: 14, borderWidth: 1, gap: 8 },
  redFlagHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  yesNoRow: { flexDirection: 'row', gap: 12 },
  yesNoBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  yesNoText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  updatedPreview: { padding: 12, borderWidth: 1, gap: 8, flexDirection: 'row', alignItems: 'center' },
  updatedLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resultContent: { flex: 1, padding: 24, gap: 16, alignItems: 'flex-start' },
  resultTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  escalatedBox: { flexDirection: 'row', gap: 8, padding: 12, borderWidth: 1, alignItems: 'flex-start' },
  escalatedText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  resultGuidance: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
