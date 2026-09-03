import React, { useEffect, useState } from 'react';
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
import { determineClassification, CLASSIFICATION_INFO } from '@/services/classificationEngine';
import type { Assessment, Classification } from '@/types/assessment';
import { BODY_REGIONS } from '@/types/assessment';
import * as Haptics from 'expo-haptics';

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();
  const { save } = useHistory();
  const [saved, setSaved] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [whyExpanded, setWhyExpanded] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Build assessment and classify
  const now = new Date().toISOString();
  const assessment: Assessment = {
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

  const result = determineClassification(assessment);
  const decision = result.participationDecision;

  const finalAssessment: Assessment = {
    ...assessment,
    classification: result.classification,
    classificationReasons: result.reasons,
    participationDecision: decision,
  };

  const info = CLASSIFICATION_INFO[result.classification];
  const regionLabel = BODY_REGIONS.find(r => r.value === ctx.symptomContext?.bodyRegion)?.label;

  const classColor = {
    green: colors.green,
    yellow: colors.yellow,
    orange: colors.orange,
    red: colors.red,
  }[result.classification];

  const classBg = {
    green: colors.greenBg,
    yellow: colors.yellowBg,
    orange: colors.orangeBg,
    red: colors.redBg,
  }[result.classification];

  const classBorder = {
    green: colors.greenBorder,
    yellow: colors.yellowBorder,
    orange: colors.orangeBorder,
    red: colors.redBorder,
  }[result.classification];

  const handleSave = async () => {
    if (saved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = finalAssessment.id;
    await save(finalAssessment);
    setSaved(true);
    setAssessmentId(id);
  };

  // Auto-save on mount
  useEffect(() => {
    handleSave();
  }, []);

  const handleModifications = () => {
    router.push('/assessment/modifications');
  };

  const handleSessionCheckin = () => {
    router.push('/assessment/session-checkin');
  };

  const handleFollowUp = () => {
    if (assessmentId) {
      router.push(`/follow-up/${assessmentId}`);
    }
  };

  const handleDone = () => {
    ctx.resetAssessment();
    router.replace('/');
  };

  // Show modifications button when there are demand variable recommendations
  const showModifications =
    result.classification === 'yellow' || result.classification === 'orange';

  // Show referral info for red results
  const isReferral = result.classification === 'red';
  const referralLevel = decision?.referralLevel;
  const referralLabel =
    referralLevel === 'emergency'
      ? 'Seek Emergency Care'
      : referralLevel === 'urgent_medical'
      ? 'Seek Urgent Medical Evaluation'
      : 'Seek Sports Medicine Evaluation';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View style={styles.backBtn} />
        <Text style={styles.headerTitle}>Participation Recommendation</Text>
        <TouchableOpacity onPress={handleDone} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Classification hero */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: classBg, borderColor: classBorder, borderRadius: colors.radius },
          ]}
        >
          <ClassificationBadge classification={result.classification} size="lg" />
          <Text style={[styles.heroTitle, { color: classColor }]}>{info.title}</Text>
          {regionLabel && (
            <Text style={[styles.heroRegion, { color: colors.mutedForeground }]}>{regionLabel}</Text>
          )}
          <Text style={[styles.heroSummary, { color: colors.foreground }]}>{info.summary}</Text>
        </View>

        {/* Why This Recommendation */}
        {decision?.educationalExplanation && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setWhyExpanded(e => !e); }}
              style={styles.sectionHeader}
              activeOpacity={0.7}
              testID="why-recommendation-toggle"
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="bulb-outline" size={18} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why this recommendation?</Text>
              </View>
              <Ionicons
                name={whyExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {whyExpanded && (
              <Text style={[styles.explanationText, { color: colors.foreground }]}>
                {decision.educationalExplanation}
              </Text>
            )}
          </View>
        )}

        {/* Findings that drove the recommendation */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {result.classification === 'green' ? 'No limiting findings' : 'Findings driving this recommendation'}
          </Text>
          {result.reasons.map((reason, i) => (
            <View key={i} style={styles.reasonRow}>
              <Ionicons
                name={result.classification === 'green' ? 'checkmark-circle' : 'information-circle-outline'}
                size={16}
                color={classColor}
              />
              <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* Monitoring instructions */}
        {decision?.monitoringInstructions && decision.monitoringInstructions.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {isReferral ? 'Do not:' : 'Stop and reassess if:'}
            </Text>
            {(isReferral ? decision.monitoringInstructions : info.stopConditions).map((cond, i) => (
              <View key={i} style={styles.reasonRow}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.orange} />
                <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>{cond}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Seek care box — always visible for all classifications */}
        <View
          style={[
            styles.seekCareBox,
            {
              backgroundColor: isReferral ? classBg : colors.secondary,
              borderColor: isReferral ? classBorder : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons
            name="medical-outline"
            size={18}
            color={isReferral ? classColor : colors.accent}
          />
          <Text style={[styles.seekCareText, { color: colors.foreground }]}>
            {isReferral ? referralLabel + ': ' : ''}{info.seekCare}
          </Text>
        </View>

        {/* Safety/referral note (always shown, never paywalled) */}
        {decision && (decision.referralLevel === 'sports_medicine' || decision.referralLevel === 'urgent_medical') && (
          <View style={[styles.referralBox, { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius }]}>
            <Ionicons name="warning-outline" size={18} color={colors.red} />
            <Text style={[styles.referralText, { color: colors.red }]}>
              {decision.referralLevel === 'urgent_medical'
                ? 'Seek prompt medical or sports medicine evaluation. This finding warrants timely assessment.'
                : 'A sports medicine evaluation is recommended before progressing this activity.'}
            </Text>
          </View>
        )}

        {/* Action: Modification plan */}
        {showModifications && (
          <TouchableOpacity
            onPress={handleModifications}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            testID="view-modifications-btn"
          >
            <Ionicons name="options-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
              View Modification Plan
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {/* Action: During-session check-in */}
        {(result.classification === 'green' || result.classification === 'yellow') && (
          <TouchableOpacity
            onPress={handleSessionCheckin}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: colors.radius }]}
            testID="session-checkin-btn"
          >
            <Ionicons name="pulse-outline" size={20} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
              During-Session Check-In
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Action: 24-hour follow-up */}
        {saved && assessmentId && (
          <TouchableOpacity
            onPress={handleFollowUp}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: colors.radius }]}
            testID="follow-up-btn"
          >
            <Ionicons name="calendar-outline" size={20} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
              24-Hour Follow-Up
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Evidence stub (expandable) */}
        <View style={[styles.evidenceBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.evidenceHeader}>
            <Ionicons name="library-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.evidenceTitle, { color: colors.mutedForeground }]}>About this recommendation</Text>
          </View>
          <Text style={[styles.evidenceBody, { color: colors.mutedForeground }]}>
            ATPRX uses an evidence-informed synthesis of established principles from sports medicine, load management, and return-to-participation decision-making. This tool is a coach decision support aid — it does not diagnose injury, provide medical clearance, or replace evaluation by a licensed healthcare professional.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 },
        ]}
      >
        <TouchableOpacity
          onPress={handleDone}
          activeOpacity={0.85}
          style={[styles.doneFullBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          testID="result-done-btn"
        >
          <Text style={[styles.doneBtnFullText, { color: colors.primaryForeground }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 48 },
  doneBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  heroCard: { padding: 20, borderWidth: 1, gap: 8, alignItems: 'flex-start' },
  heroTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  heroRegion: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  heroSummary: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, marginTop: 4 },
  section: { padding: 16, borderWidth: 1, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  explanationText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  reasonRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reasonText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  seekCareBox: { padding: 14, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  seekCareText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  referralBox: { padding: 14, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  referralText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionBtnText: { flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  evidenceBox: { padding: 14, borderWidth: 1, gap: 8 },
  evidenceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evidenceTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  evidenceBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  doneFullBtn: { paddingVertical: 16, alignItems: 'center' },
  doneBtnFullText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
