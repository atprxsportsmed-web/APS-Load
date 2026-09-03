import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAssessment } from '@/context/AssessmentContext';
import { ProgressBar } from '@/components/ProgressBar';
import { BODY_REGIONS, type BodyRegion, type Side } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

const SIDES: { value: Side; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
  { value: 'central', label: 'Central' },
  { value: 'not_applicable', label: 'N/A' },
];

export default function SymptomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();

  const [bodyRegion, setBodyRegion] = useState<BodyRegion | null>(null);
  const [side, setSide] = useState<Side | null>(null);
  const [activity, setActivity] = useState('');
  const [onsetTiming, setOnsetTiming] = useState<'sudden' | 'gradual' | null>(null);
  const [directTrauma, setDirectTrauma] = useState<boolean | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canContinue = bodyRegion !== null && side !== null && onsetTiming !== null && directTrauma !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Store partial — full context saved in symptom-details
    (ctx as any)._partialSymptom = { bodyRegion, side, activity, onsetTiming, directTrauma };
    router.push('/assessment/symptom-details');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Context</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={2} totalSteps={6} label="Step 2 of 6 — Symptom Context" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Body region */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Where do you notice the issue?
        </Text>
        <View style={styles.regionGrid}>
          {BODY_REGIONS.map(r => {
            const selected = bodyRegion === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                onPress={() => { Haptics.selectionAsync(); setBodyRegion(r.value); }}
                activeOpacity={0.7}
                style={[
                  styles.regionChip,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.accent : colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: 8,
                  },
                ]}
                testID={`region-${r.value}`}
              >
                <Text style={[styles.regionLabel, { color: selected ? colors.accent : colors.foreground }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Side */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Side</Text>
        <View style={styles.row}>
          {SIDES.map(s => {
            const selected = side === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                onPress={() => { Haptics.selectionAsync(); setSide(s.value); }}
                activeOpacity={0.7}
                style={[
                  styles.sideBtn,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.accent : colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: 8,
                  },
                ]}
                testID={`side-${s.value}`}
              >
                <Text style={[styles.sideBtnText, { color: selected ? colors.accent : colors.foreground }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Activity */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          What activity were you doing? <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.mutedForeground }}>(optional)</Text>
        </Text>
        <TextInput
          value={activity}
          onChangeText={setActivity}
          placeholder="e.g. overhead press, running, squatting"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
            },
          ]}
          testID="activity-input"
        />

        {/* Onset */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How did it start?</Text>
        <View style={styles.twoCol}>
          {(['sudden', 'gradual'] as const).map(o => {
            const selected = onsetTiming === o;
            return (
              <TouchableOpacity
                key={o}
                onPress={() => { Haptics.selectionAsync(); setOnsetTiming(o); }}
                activeOpacity={0.7}
                style={[
                  styles.bigOption,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.accent : colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: colors.radius,
                  },
                ]}
                testID={`onset-${o}`}
              >
                <Ionicons
                  name={o === 'sudden' ? 'flash-outline' : 'trending-up-outline'}
                  size={24}
                  color={selected ? colors.accent : colors.mutedForeground}
                />
                <Text style={[styles.bigOptionLabel, { color: selected ? colors.accent : colors.foreground }]}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </Text>
                <Text style={[styles.bigOptionDesc, { color: colors.mutedForeground }]}>
                  {o === 'sudden' ? 'Immediate, clear moment of onset' : 'Built up over time or during warm-up'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Direct trauma */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Was there direct contact, impact, or trauma?
        </Text>
        <View style={styles.twoCol}>
          {([true, false] as const).map(val => {
            const selected = directTrauma === val;
            return (
              <TouchableOpacity
                key={String(val)}
                onPress={() => { Haptics.selectionAsync(); setDirectTrauma(val); }}
                activeOpacity={0.7}
                style={[
                  styles.yesNoBtn,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.accent : colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: colors.radius,
                  },
                ]}
                testID={`trauma-${val}`}
              >
                <Text style={[styles.yesNoText, { color: selected ? colors.accent : colors.foreground }]}>
                  {val ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[
            styles.continueBtn,
            {
              backgroundColor: canContinue ? colors.primary : colors.muted,
              borderRadius: colors.radius,
            },
          ]}
          testID="symptom-continue-btn"
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  regionLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 8 },
  sideBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, alignItems: 'center' },
  sideBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  bigOption: {
    flex: 1, padding: 16, borderWidth: 1, gap: 6, alignItems: 'center',
  },
  bigOptionLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  bigOptionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  yesNoBtn: { flex: 1, paddingVertical: 16, borderWidth: 1, alignItems: 'center' },
  yesNoText: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 10,
  },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
