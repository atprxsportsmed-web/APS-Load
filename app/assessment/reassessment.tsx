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
import type { SymptomResponse, PostLoadOverall } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

type Resp = SymptomResponse;
const RESP_OPTIONS: { value: Resp; label: string; icon: string }[] = [
  { value: 'improved', label: 'Improved', icon: 'trending-up' },
  { value: 'unchanged', label: 'Unchanged', icon: 'remove' },
  { value: 'worsened', label: 'Worsened', icon: 'trending-down' },
];

const OVERALL_OPTIONS: { value: PostLoadOverall; label: string; desc: string }[] = [
  { value: 'improved', label: 'Improved', desc: 'The athlete feels better than before the load check' },
  { value: 'stable', label: 'Stable', desc: 'Similar to before — no meaningful change' },
  { value: 'worsened', label: 'Worsened', desc: 'The athlete feels worse or less capable than before' },
];

function DomainRow({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: Resp | null;
  onChange: (v: Resp) => void;
  testId: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.domainRow}>
      <Text style={[styles.domainLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.respBtns}>
        {RESP_OPTIONS.map(opt => {
          const sel = value === opt.value;
          const bgColor = sel
            ? opt.value === 'improved'
              ? colors.greenBg
              : opt.value === 'worsened'
              ? colors.redBg
              : colors.secondary
            : colors.card;
          const bdColor = sel
            ? opt.value === 'improved'
              ? colors.green
              : opt.value === 'worsened'
              ? colors.red
              : colors.accent
            : colors.border;
          const txtColor = sel
            ? opt.value === 'improved'
              ? colors.green
              : opt.value === 'worsened'
              ? colors.red
              : colors.accent
            : colors.mutedForeground;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
              activeOpacity={0.7}
              style={[styles.respBtn, { backgroundColor: bgColor, borderColor: bdColor, borderRadius: colors.radius }]}
              testID={`${testId}-${opt.value}`}
            >
              <Ionicons name={opt.icon as any} size={15} color={txtColor} />
              <Text style={[styles.respBtnText, { color: txtColor }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ReassessmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();

  const [rangeResponse, setRangeResponse] = useState<Resp | null>(null);
  const [strengthResponse, setStrengthResponse] = useState<Resp | null>(null);
  const [confidenceResponse, setConfidenceResponse] = useState<Resp | null>(null);
  const [symptomsResponse, setSymptomsResponse] = useState<Resp | null>(null);
  const [movementQualityResponse, setMovementQualityResponse] = useState<Resp | null>(null);
  const [postLoadOverall, setPostLoadOverall] = useState<PostLoadOverall | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const canContinue =
    rangeResponse !== null &&
    strengthResponse !== null &&
    confidenceResponse !== null &&
    postLoadOverall !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Map postLoadOverall to legacy OverallResponse
    const overallMap: Record<PostLoadOverall, 'clearly_improved' | 'mildly_improved' | 'unchanged' | 'mildly_worse' | 'clearly_worse'> = {
      improved: 'mildly_improved',
      stable: 'unchanged',
      worsened: 'mildly_worse',
    };

    ctx.setReassessmentData({
      rangeResponse: rangeResponse!,
      strengthResponse: strengthResponse!,
      confidenceResponse: confidenceResponse!,
      symptomsResponse: symptomsResponse ?? undefined,
      movementQualityResponse: movementQualityResponse ?? undefined,
      postLoadOverall: postLoadOverall!,
      overallResponse: overallMap[postLoadOverall!],
    });
    router.push('/assessment/result');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Load Reassessment</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={5} totalSteps={6} label="Step 5 of 6 — Post-Load Reassessment" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.question, { color: colors.foreground }]}>
          After the Controlled Load Check, how does the athlete compare to before it began?
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Compare to the start of today's check-in, not to the athlete's healthy baseline.
        </Text>

        {/* Functional domain comparisons */}
        <View style={[styles.domainsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Functional comparison</Text>
          <DomainRow label="Movement range" value={rangeResponse} onChange={setRangeResponse} testId="range" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DomainRow label="Force production" value={strengthResponse} onChange={setStrengthResponse} testId="strength" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DomainRow label="Movement quality" value={movementQualityResponse ?? null} onChange={setMovementQualityResponse} testId="quality" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DomainRow label="Symptoms" value={symptomsResponse ?? null} onChange={setSymptomsResponse} testId="symptoms" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DomainRow label="Confidence / stability" value={confidenceResponse} onChange={setConfidenceResponse} testId="confidence" />
        </View>

        {/* Overall post-load response */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Overall post-load response
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Considering everything — how does the athlete feel overall compared to before the load check?
        </Text>
        {OVERALL_OPTIONS.map(opt => {
          const sel = postLoadOverall === opt.value;
          const activeColor =
            opt.value === 'improved' ? colors.green :
            opt.value === 'worsened' ? colors.red :
            colors.accent;
          const activeBg =
            opt.value === 'improved' ? colors.greenBg :
            opt.value === 'worsened' ? colors.redBg :
            colors.secondary;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { Haptics.selectionAsync(); setPostLoadOverall(opt.value); }}
              activeOpacity={0.7}
              style={[
                styles.overallOption,
                {
                  backgroundColor: sel ? activeBg : colors.card,
                  borderColor: sel ? activeColor : colors.border,
                  borderWidth: sel ? 2 : 1,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`overall-${opt.value}`}
            >
              <Text style={[styles.overallLabel, { color: sel ? activeColor : colors.foreground }]}>
                {opt.label}
              </Text>
              <Text style={[styles.overallDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Warning: both worsened */}
        {rangeResponse === 'worsened' && strengthResponse === 'worsened' && (
          <View style={[styles.warnBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={[styles.warnText, { color: colors.red }]}>
              Both movement range and force production have declined after loading. This will significantly impact the participation recommendation.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[styles.continueBtn, { backgroundColor: canContinue ? colors.primary : colors.muted, borderRadius: colors.radius }]}
          testID="reassessment-continue-btn"
        >
          <Text style={[styles.continueBtnText, { color: canContinue ? colors.primaryForeground : colors.mutedForeground }]}>
            Get Recommendation
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
  question: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, lineHeight: 28 },
  hint: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: -4 },
  domainsCard: { padding: 16, borderWidth: 1, gap: 0 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  divider: { height: 1, marginVertical: 10 },
  domainRow: { gap: 8 },
  domainLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  respBtns: { flexDirection: 'row', gap: 8 },
  respBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderWidth: 1, gap: 5 },
  respBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  overallOption: { padding: 14, borderWidth: 1, gap: 3 },
  overallLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  overallDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  warnBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderWidth: 1, gap: 8 },
  warnText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
