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
import { SYMPTOM_QUALITIES, type Trend } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

function PainRatingSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();

  const getColor = (n: number) => {
    if (n <= 2) return colors.green;
    if (n <= 4) return colors.yellow;
    if (n <= 7) return colors.orange;
    return colors.red;
  };

  return (
    <View>
      <View style={styles.painRow}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = value === i;
          const c = getColor(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => { Haptics.selectionAsync(); onChange(i); }}
              activeOpacity={0.7}
              style={[
                styles.painBtn,
                {
                  backgroundColor: selected ? c : colors.card,
                  borderColor: selected ? c : colors.border,
                  borderWidth: selected ? 2 : 1,
                  borderRadius: 6,
                },
              ]}
              testID={`pain-${i}`}
            >
              <Text style={[styles.painBtnText, { color: selected ? '#FFFFFF' : colors.foreground }]}>
                {i}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.painLabels}>
        <Text style={[styles.painLabel, { color: colors.mutedForeground }]}>None</Text>
        <Text style={[styles.painLabel, { color: colors.mutedForeground }]}>Worst possible</Text>
      </View>
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}
function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.toggleOptions}>
        {([true, false] as const).map(v => {
          const selected = value === v;
          return (
            <TouchableOpacity
              key={String(v)}
              onPress={() => { Haptics.selectionAsync(); onChange(v); }}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: selected ? (v ? colors.secondary : colors.muted) : 'transparent',
                  borderColor: selected ? colors.accent : colors.border,
                  borderWidth: selected ? 2 : 1,
                  borderRadius: 6,
                },
              ]}
              testID={`toggle-${label}-${v}`}
            >
              <Text style={[styles.toggleBtnText, { color: selected ? colors.accent : colors.mutedForeground }]}>
                {v ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const TRENDS: { value: Trend; label: string; desc: string }[] = [
  { value: 'improving', label: 'Improving', desc: 'Getting better over time' },
  { value: 'stable', label: 'Stable', desc: 'Not changing significantly' },
  { value: 'worsening', label: 'Worsening', desc: 'Getting worse over time' },
];

export default function SymptomDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();

  const [painRating, setPainRating] = useState(0);
  const [qualities, setQualities] = useState<string[]>([]);
  const [swelling, setSwelling] = useState(false);
  const [instability, setInstability] = useState(false);
  const [locking, setLocking] = useState(false);
  const [numbnessTingling, setNumbnessTingling] = useState(false);
  const [nightPain, setNightPain] = useState(false);
  const [restPain, setRestPain] = useState(false);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [previousHistory, setPreviousHistory] = useState<boolean | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canContinue = trend !== null && previousHistory !== null;

  const toggleQuality = (id: string) => {
    Haptics.selectionAsync();
    setQualities(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const partial = (ctx as any)._partialSymptom ?? {};
    ctx.setSymptomContext({
      bodyRegion: partial.bodyRegion ?? 'other',
      side: partial.side ?? 'not_applicable',
      activity: partial.activity ?? '',
      onsetTiming: partial.onsetTiming ?? 'gradual',
      directTrauma: partial.directTrauma ?? false,
      painRating,
      qualities,
      swelling,
      instability,
      locking,
      numbnessTingling,
      nightPain,
      restPain,
      trend: trend!,
      previousHistory: previousHistory!,
    });
    router.push('/assessment/movement');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Details</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={2} totalSteps={6} label="Step 2 of 6 — Symptom Details" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pain rating */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Current pain level (0–10)
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          At this moment, before any movement.
        </Text>
        <PainRatingSelector value={painRating} onChange={setPainRating} />

        {/* Qualities */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          How would you describe it? <Text style={[styles.optional, { color: colors.mutedForeground }]}>(select all that apply)</Text>
        </Text>
        <View style={styles.chipRow}>
          {SYMPTOM_QUALITIES.map(q => {
            const selected = qualities.includes(q.id);
            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => toggleQuality(q.id)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.accent : colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: 20,
                  },
                ]}
                testID={`quality-${q.id}`}
              >
                <Text style={[styles.chipText, { color: selected ? colors.accent : colors.foreground }]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Special symptoms */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Additional symptoms</Text>
        <View style={[styles.toggleGroup, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <ToggleRow label="Swelling" value={swelling} onChange={setSwelling} />
          <ToggleRow label="Instability / giving way" value={instability} onChange={setInstability} />
          <ToggleRow label="Locking or catching" value={locking} onChange={setLocking} />
          <ToggleRow label="Numbness or tingling" value={numbnessTingling} onChange={setNumbnessTingling} />
          <ToggleRow label="Pain at night" value={nightPain} onChange={setNightPain} />
          <ToggleRow label="Pain at rest" value={restPain} onChange={setRestPain} />
        </View>

        {numbnessTingling && (
          <View style={[styles.warningBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={[styles.warningText, { color: colors.red }]}>
              Numbness or tingling may indicate neurological involvement. This will be factored into your result.
            </Text>
          </View>
        )}

        {/* Trend */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          How have symptoms been trending?
        </Text>
        {TRENDS.map(t => {
          const selected = trend === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              onPress={() => { Haptics.selectionAsync(); setTrend(t.value); }}
              activeOpacity={0.7}
              style={[
                styles.trendBtn,
                {
                  backgroundColor: selected ? colors.secondary : colors.card,
                  borderColor: selected ? colors.accent : colors.border,
                  borderWidth: selected ? 2 : 1,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`trend-${t.value}`}
            >
              <Text style={[styles.trendLabel, { color: selected ? colors.accent : colors.foreground }]}>
                {t.label}
              </Text>
              <Text style={[styles.trendDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Previous history */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Have you had symptoms in this area before?
        </Text>
        <View style={styles.twoCol}>
          {([true, false] as const).map(val => {
            const selected = previousHistory === val;
            return (
              <TouchableOpacity
                key={String(val)}
                onPress={() => { Haptics.selectionAsync(); setPreviousHistory(val); }}
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
                testID={`history-${val}`}
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
          style={[styles.continueBtn, { backgroundColor: canContinue ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="symptom-details-continue-btn"
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  optional: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  painRow: { flexDirection: 'row', gap: 4 },
  painBtn: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  painBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  painLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  painLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggleGroup: { borderWidth: 1, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  toggleLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  toggleOptions: { flexDirection: 'row', gap: 6 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  toggleBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderWidth: 1, gap: 8 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  trendBtn: { padding: 14, borderWidth: 1, gap: 3 },
  trendLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  trendDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  twoCol: { flexDirection: 'row', gap: 12 },
  yesNoBtn: { flex: 1, paddingVertical: 16, borderWidth: 1, alignItems: 'center' },
  yesNoText: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
