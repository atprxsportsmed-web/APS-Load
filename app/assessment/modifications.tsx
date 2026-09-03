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
import { determineClassification, CLASSIFICATION_INFO } from '@/services/classificationEngine';
import { MODIFICATION_OPTIONS } from '@/types/assessment';
import type { Assessment } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

export default function ModificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();
  const { update } = useHistory();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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
    modifications: [],
    sessionCheckins: [],
  };
  const result = determineClassification(tempAssessment);
  const decision = result.participationDecision;

  // Engine-recommended modifications from the decision
  const engineRecommended = decision?.recommendedModifications ?? {};

  const [selected, setSelected] = useState<string[]>(() => {
    // Pre-select engine-recommended ones
    const auto = MODIFICATION_OPTIONS
      .filter(o => engineRecommended[o.id as keyof typeof engineRecommended])
      .map(o => o.id);
    return auto.length > 0 ? auto : ctx.modifications;
  });

  const toggleOption = (id: string) => {
    Haptics.selectionAsync();
    setSelected(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctx.setModifications(selected);
    if (ctx.assessmentId) {
      await update({
        id: ctx.assessmentId,
        createdAt: tempAssessment.createdAt,
        updatedAt: new Date().toISOString(),
        safetyScreen: tempAssessment.safetyScreen,
        symptomContext: tempAssessment.symptomContext,
        movementAssessment: tempAssessment.movementAssessment,
        loadTest: tempAssessment.loadTest,
        reassessment: tempAssessment.reassessment,
        classification: result.classification,
        classificationReasons: result.reasons,
        modifications: selected,
        sessionCheckins: [],
        participationDecision: decision,
      });
    }
    router.back();
  };

  const classInfo = CLASSIFICATION_INFO[result.classification];
  const classColor = {
    green: colors.green, yellow: colors.yellow, orange: colors.orange, red: colors.red,
  }[result.classification];
  const classBg = {
    green: colors.greenBg, yellow: colors.yellowBg, orange: colors.orangeBg, red: colors.redBg,
  }[result.classification];
  const classBorder = {
    green: colors.greenBorder, yellow: colors.yellowBorder, orange: colors.orangeBorder, red: colors.redBorder,
  }[result.classification];

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
        <Text style={styles.headerTitle}>Modification Plan</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Classification context */}
        <View style={[styles.classBox, { backgroundColor: classBg, borderColor: classBorder, borderRadius: colors.radius }]}>
          <Text style={[styles.classLabel, { color: classColor }]}>{classInfo.title}</Text>
          <Text style={[styles.classHint, { color: colors.foreground }]}>
            {result.classification === 'orange'
              ? `Shift today${`'`}s session priority. Select the demand variables to reduce — highlighted options are recommended based on the check-in findings.`
              : `Reduce the relevant training demand. Highlighted options are recommended based on the check-in findings.`}
          </Text>
        </View>

        {/* Demand variable selection */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Demand variables to reduce
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Highlighted categories are recommended based on today{`'`}s findings. Select all that apply to your session plan.
        </Text>

        {MODIFICATION_OPTIONS.map(opt => {
          const sel = selected.includes(opt.id);
          const recommended = !!engineRecommended[opt.id as keyof typeof engineRecommended];
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => toggleOption(opt.id)}
              activeOpacity={0.7}
              style={[
                styles.optCard,
                {
                  backgroundColor: sel ? colors.secondary : colors.card,
                  borderColor: sel ? colors.accent : recommended ? colors.accent + '60' : colors.border,
                  borderWidth: sel ? 2 : 1,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`mod-${opt.id}`}
            >
              <View style={styles.optHeader}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.optTitleRow}>
                    <Text style={[styles.optTitle, { color: sel ? colors.accent : colors.foreground }]}>
                      {opt.label}
                    </Text>
                    {recommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                        <Text style={[styles.recommendedText, { color: colors.accent }]}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>{opt.description}</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: sel ? colors.accent : colors.border,
                      backgroundColor: sel ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  {sel && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
              </View>
              {sel && (
                <View style={[styles.exampleRow, { borderTopColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
                  <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                    Example: {opt.example}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Summary */}
        {selected.length > 0 && (
          <View style={[styles.summaryBox, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Today{`'`}s plan</Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              Reducing: {selected
                .map(id => MODIFICATION_OPTIONS.find(o => o.id === id)?.label ?? id)
                .join(`, `)}
            </Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              Reassess symptoms during the session and again tomorrow.
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}
      >
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          testID="save-modifications-btn"
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            Save Plan
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  classBox: { padding: 16, borderWidth: 1, gap: 6 },
  classLabel: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  classHint: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -4 },
  optCard: { padding: 14, borderWidth: 1, gap: 0 },
  optHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  optTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  optTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  recommendedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  recommendedText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  optDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 3 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exampleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  exampleText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  summaryBox: { padding: 14, borderWidth: 1, gap: 4 },
  summaryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  summaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
