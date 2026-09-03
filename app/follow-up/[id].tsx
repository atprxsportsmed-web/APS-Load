import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHistory } from '@/context/HistoryContext';
import { classifyFollowUpTrajectory } from '@/decision-engine';
import { BODY_REGIONS } from '@/types/assessment';
import type { SymptomResponse } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

type Severity = 'none' | 'mild' | 'moderate' | 'significant';
const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
];

function SeverityRow({ label, value, onChange }: { label: string; value: Severity; onChange: (v: Severity) => void }) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.fourRow}>
        {SEVERITIES.map(s => {
          const sel = value === s.value;
          const c = { none: colors.green, mild: colors.yellow, moderate: colors.orange, significant: colors.red }[s.value];
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => { Haptics.selectionAsync(); onChange(s.value); }}
              style={[styles.fourBtn, { backgroundColor: sel ? c + '22' : colors.card, borderColor: sel ? c : colors.border, borderWidth: sel ? 2 : 1, borderRadius: 8 }]}
              testID={`severity-${label.replace(/\s+/g, '-').toLowerCase()}-${s.value}`}
            >
              <Text style={[styles.fourBtnText, { color: sel ? c : colors.foreground }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ThreeWay({ label, value, onChange }: { label: string; value: SymptomResponse | null; onChange: (v: SymptomResponse) => void }) {
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
              style={[styles.threeBtn, { backgroundColor: sel ? o.color + '22' : colors.card, borderColor: sel ? o.color : colors.border, borderWidth: sel ? 2 : 1, borderRadius: colors.radius }]}
              testID={`followup-${label.replace(/\s+/g, '-').toLowerCase()}-${o.v}`}
            >
              <Text style={[styles.threeBtnText, { color: sel ? o.color : colors.foreground }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ToggleYesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.toggleBtns}>
        {([true, false] as const).map(v => {
          const sel = value === v;
          return (
            <TouchableOpacity
              key={String(v)}
              onPress={() => { Haptics.selectionAsync(); onChange(v); }}
              style={[styles.toggleBtn2, { backgroundColor: sel ? colors.secondary : 'transparent', borderColor: sel ? colors.accent : colors.border, borderRadius: 6 }]}
              testID={`followup-${label.replace(/\s+/g, '-').toLowerCase()}-${v}`}
            >
              <Text style={[styles.toggleBtnText2, { color: sel ? colors.accent : colors.mutedForeground }]}>{v ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Trajectory display config
const TRAJECTORY_INFO: Record<string, { label: string; colorKey: 'green' | 'yellow' | 'orange' | 'red' }> = {
  better: { label: 'Recovering well', colorKey: 'green' },
  back_to_baseline: { label: 'Back to baseline', colorKey: 'yellow' },
  mildly_worse: { label: 'Mild post-session response', colorKey: 'orange' },
  clearly_worse: { label: 'Function declining', colorKey: 'red' },
};

export default function FollowUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, update } = useHistory();

  const assessment = getById(id ?? '');
  const regionLabel = BODY_REGIONS.find(r => r.value === assessment?.symptomContext?.bodyRegion)?.label ?? 'the affected area';

  const [symptomsAtRest, setSymptomsAtRest] = useState<Severity>('none');
  const [symptomsWithActivity, setSymptomsWithActivity] = useState<Severity>('none');
  const [morningStiffness, setMorningStiffness] = useState<boolean | null>(null);
  const [swelling, setSwelling] = useState<boolean | null>(null);
  const [rangeOfMotion, setRangeOfMotion] = useState<SymptomResponse | null>(null);
  const [strength, setStrength] = useState<SymptomResponse | null>(null);
  const [comparedToBefore, setComparedToBefore] = useState<'better' | 'same' | 'worse' | null>(null);
  const [sleepAffected, setSleepAffected] = useState<boolean | null>(null);
  const [activityLimited, setActivityLimited] = useState<boolean | null>(null);
  const [savedResult, setSavedResult] = useState<ReturnType<typeof classifyFollowUpTrajectory> | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canSave =
    morningStiffness !== null &&
    swelling !== null &&
    rangeOfMotion !== null &&
    strength !== null &&
    comparedToBefore !== null &&
    sleepAffected !== null &&
    activityLimited !== null;

  const handleSave = async () => {
    if (!canSave || !assessment) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const result = classifyFollowUpTrajectory({
      comparedToBefore: comparedToBefore!,
      activityLimited: activityLimited!,
      swelling: swelling!,
      rangeOfMotion: rangeOfMotion!,
      strength: strength!,
      morningStiffness: morningStiffness!,
      symptomsAtRest,
    });

    const followUpData = {
      completedAt: new Date().toISOString(),
      symptomsAtRest,
      symptomsWithActivity,
      morningStiffness: morningStiffness!,
      swelling: swelling!,
      rangeOfMotion: rangeOfMotion!,
      strength: strength!,
      comparedToBefore: comparedToBefore!,
      sleepAffected: sleepAffected!,
      activityLimited: activityLimited!,
      nextDayResponse: result.nextDayResponse as any,
    };

    await update({
      ...assessment,
      followUp: followUpData,
      updatedAt: new Date().toISOString(),
    });

    setSavedResult(result);
  };

  if (savedResult) {
    const trajInfo = TRAJECTORY_INFO[savedResult.trajectory] ?? TRAJECTORY_INFO.back_to_baseline;
    const resultColor = {
      green: colors.green, yellow: colors.yellow, orange: colors.orange, red: colors.red,
    }[trajInfo.colorKey];
    const resultBg = {
      green: colors.greenBg, yellow: colors.yellowBg, orange: colors.orangeBg, red: colors.redBg,
    }[trajInfo.colorKey];
    const resultBorder = {
      green: colors.greenBorder, yellow: colors.yellowBorder, orange: colors.orangeBorder, red: colors.redBorder,
    }[trajInfo.colorKey];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Follow-Up Saved</Text>
          <TouchableOpacity onPress={() => router.replace(`/(tabs)/history`)} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 40 }]}>
          {/* Trajectory result */}
          <View style={[styles.resultCard, { backgroundColor: resultBg, borderColor: resultBorder, borderRadius: colors.radius }]}>
            <Text style={[styles.resultTrajectory, { color: resultColor }]}>{trajInfo.label}</Text>
            <Text style={[styles.resultRegion, { color: colors.mutedForeground }]}>{regionLabel}</Text>
          </View>

          {/* Recommendations */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Next session guidance</Text>
            {savedResult.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <Ionicons
                  name={savedResult.trajectory === 'clearly_worse' ? 'warning-outline' : 'checkmark-circle-outline'}
                  size={16}
                  color={resultColor}
                />
                <Text style={[styles.recText, { color: colors.foreground }]}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Referral notice */}
          {savedResult.referralRecommended && (
            <View style={[styles.referralBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
              <Ionicons name="medical-outline" size={18} color={colors.red} />
              <Text style={[styles.referralText, { color: colors.red }]}>
                A sports medicine evaluation is recommended. Repeated failure to improve toward the previous session baseline warrants professional evaluation.
              </Text>
            </View>
          )}

          {/* What drives next check-in */}
          <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>What to monitor next</Text>
            <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
              Complete a pre-session check-in before the next training session. The trajectory information from this follow-up helps calibrate the recommendation.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace(`/(tabs)/history`)}
            activeOpacity={0.85}
            style={[styles.doneFullBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Text style={[styles.doneFullText, { color: colors.primaryForeground }]}>Back to History</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>24-Hour Follow-Up</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          How is {regionLabel} responding since yesterday?
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Compare to how the athlete felt at the START of yesterday's session — before training began.
        </Text>

        {/* Overall comparison */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overall, compared to before yesterday's session:</Text>
        <View style={styles.threeRow}>
          {(['better', 'same', 'worse'] as const).map(v => {
            const sel = comparedToBefore === v;
            const c = v === 'better' ? colors.green : v === 'same' ? colors.yellow : colors.red;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => { Haptics.selectionAsync(); setComparedToBefore(v); }}
                activeOpacity={0.7}
                style={[styles.threeBtn, { backgroundColor: sel ? c + '22' : colors.card, borderColor: sel ? c : colors.border, borderWidth: sel ? 2 : 1, borderRadius: colors.radius }]}
                testID={`compared-${v}`}
              >
                <Text style={[styles.threeBtnText, { color: sel ? c : colors.foreground }]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Symptom severity */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Symptom levels now</Text>
          <SeverityRow label="At rest" value={symptomsAtRest} onChange={setSymptomsAtRest} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SeverityRow label="With activity" value={symptomsWithActivity} onChange={setSymptomsWithActivity} />
        </View>

        {/* Functional comparisons */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Function compared to before yesterday:</Text>
          <ThreeWay label="Movement range" value={rangeOfMotion} onChange={setRangeOfMotion} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThreeWay label="Strength / force" value={strength} onChange={setStrength} />
        </View>

        {/* Yes/No questions */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Additional findings</Text>
          <ToggleYesNo label="Morning stiffness?" value={morningStiffness} onChange={setMorningStiffness} />
          <ToggleYesNo label="Swelling or puffiness?" value={swelling} onChange={setSwelling} />
          <ToggleYesNo label="Sleep affected?" value={sleepAffected} onChange={setSleepAffected} />
          <ToggleYesNo label="Daily activities noticeably limited?" value={activityLimited} onChange={setActivityLimited} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="followup-save-btn"
        >
          <Text style={[styles.saveBtnText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
            Save Follow-Up
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
  question: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, lineHeight: 28 },
  hint: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  card: { padding: 16, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  fieldLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fourRow: { flexDirection: 'row', gap: 6 },
  fourBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  fourBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  threeRow: { flexDirection: 'row', gap: 8 },
  threeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  threeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  toggleLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  toggleBtns: { flexDirection: 'row', gap: 6 },
  toggleBtn2: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  toggleBtnText2: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  // Result screen
  resultCard: { padding: 20, borderWidth: 1, gap: 6 },
  resultTrajectory: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  resultRegion: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  section: { padding: 16, borderWidth: 1, gap: 10 },
  recRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  recText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  referralBox: { padding: 14, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  referralText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  infoBox: { padding: 14, borderWidth: 1, gap: 6 },
  infoTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  infoBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  doneFullBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  doneFullText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
