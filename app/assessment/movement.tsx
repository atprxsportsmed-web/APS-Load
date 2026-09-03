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
import type { RangeStatus, TaskRangeAccess } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

// Movement availability (how much active movement is accessible?)
const AVAILABILITY_OPTIONS: { value: RangeStatus; label: string; desc: string }[] = [
  { value: 'full', label: 'Normal', desc: 'Movement feels normal for this athlete' },
  { value: 'mildly_reduced', label: 'Slightly reduced', desc: 'A bit less than normal, but mostly available' },
  { value: 'clearly_reduced', label: 'Clearly reduced', desc: 'Noticeably less than normal' },
  { value: 'unable', label: 'Unable to move', desc: 'Cannot perform the movement at all' },
];

// Task-specific movement access (the key question per spec)
const TASK_ACCESS_OPTIONS: { value: TaskRangeAccess; label: string; desc: string }[] = [
  { value: 'yes_normally', label: 'Yes, normally', desc: 'Full access without symptoms' },
  { value: 'yes_mild_symptoms', label: 'Yes, with mild symptoms', desc: 'Range available, but mild discomfort present' },
  { value: 'yes_with_compensation', label: 'Yes, but with compensation', desc: 'Has to alter technique to access the range' },
  { value: 'only_partially', label: 'Only partially', desc: 'Can access some but not all of the required range' },
  { value: 'no', label: 'No', desc: 'Cannot access the movement required for today\'s activity' },
];

// Symptom behavior during repeated active movement
type RepeatedResp = 'improves' | 'stable' | 'progressively_worsens';
const REPEATED_OPTIONS: { value: RepeatedResp; label: string; desc: string }[] = [
  { value: 'improves', label: 'Improves', desc: 'Symptoms decrease or movement becomes easier with reps' },
  { value: 'stable', label: 'Stable', desc: 'No meaningful change through the repetitions' },
  { value: 'progressively_worsens', label: 'Progressively worsens', desc: 'Symptoms increase or range decreases with each rep' },
];

function OptionList<T extends string>({
  options,
  selected,
  onSelect,
  testIdPrefix,
}: {
  options: { value: T; label: string; desc: string }[];
  selected: T | null;
  onSelect: (v: T) => void;
  testIdPrefix: string;
}) {
  const colors = useColors();
  return (
    <>
      {options.map(opt => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onSelect(opt.value); }}
            activeOpacity={0.7}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.secondary : colors.card,
                borderColor: isSelected ? colors.accent : colors.border,
                borderWidth: isSelected ? 2 : 1,
                borderRadius: colors.radius,
              },
            ]}
            testID={`${testIdPrefix}-${opt.value}`}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: isSelected ? colors.accent : colors.foreground }]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
            </View>
            <View style={[styles.radio, { borderColor: isSelected ? colors.accent : colors.border, backgroundColor: isSelected ? colors.accent : 'transparent' }]}>
              {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

export default function MovementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();

  const [availability, setAvailability] = useState<RangeStatus | null>(null);
  const [taskAccess, setTaskAccess] = useState<TaskRangeAccess | null>(null);
  const [repeatedResponse, setRepeatedResponse] = useState<RepeatedResp | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canContinue = availability !== null && taskAccess !== null && repeatedResponse !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ctx.setMovementData({
      rangeStatus: availability!,
      taskRangeAccess: taskAccess!,
      repeatedMovementResponse: repeatedResponse!,
    });
    router.push('/assessment/load-test');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movement Capacity</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={3} totalSteps={6} label="Step 3 of 6 — Movement Capacity" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Context box */}
        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Active movement only</Text>
          <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
            Observe what the athlete can do using their own muscles — do not push, assist, or perform clinical tests. Compare to what feels normal for this athlete.
          </Text>
        </View>

        {/* Q1: Movement availability */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          How available is active movement in the affected area?
        </Text>
        <OptionList
          options={AVAILABILITY_OPTIONS}
          selected={availability}
          onSelect={setAvailability}
          testIdPrefix="avail"
        />

        {availability === 'unable' && (
          <View style={[styles.warnBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={[styles.warnText, { color: colors.red }]}>
              Inability to move the affected area will significantly impact the participation recommendation.
            </Text>
          </View>
        )}

        {/* Q2: Task-specific access */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Can the athlete access the movement required for{` `}
          <Text style={{ fontFamily: 'Inter_700Bold' }}>today's intended activity</Text>?
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Think about the specific movement demanded by today's training — not general ROM.
        </Text>
        <OptionList
          options={TASK_ACCESS_OPTIONS}
          selected={taskAccess}
          onSelect={setTaskAccess}
          testIdPrefix="task"
        />

        {/* Q3: Repeated movement response */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          After repeating the movement several times, symptoms:
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Only perform if safe to do so. Select "Progressively worsens" if the athlete cannot or should not repeat the movement.
        </Text>
        <OptionList
          options={REPEATED_OPTIONS}
          selected={repeatedResponse}
          onSelect={setRepeatedResponse}
          testIdPrefix="repeated"
        />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[styles.continueBtn, { backgroundColor: canContinue ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="movement-continue-btn"
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  infoBox: { padding: 16, borderWidth: 1, gap: 6 },
  infoTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  infoBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 4, lineHeight: 24 },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -6 },
  option: { padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionContent: { flex: 1, gap: 3 },
  optionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  warnBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderWidth: 1, gap: 8 },
  warnText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
