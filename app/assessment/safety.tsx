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
import { ProgressBar } from '@/components/ProgressBar';
import { URGENT_FLAGS } from '@/types/assessment';
import { generateId } from '@/services/storage';
import * as Haptics from 'expo-haptics';

export default function SafetyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ctx = useAssessment();
  const { save } = useHistory();
  const [selected, setSelected] = useState<string[]>([]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const hasUrgentFlag = selected.length > 0;

  // Determine if any selected flag is emergency-level
  const hasEmergencyFlag = selected.some(
    id => URGENT_FLAGS.find(f => f.id === id)?.level === 'emergency',
  );

  const toggleFlag = (id: string) => {
    Haptics.selectionAsync();
    setSelected(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ctx.setSafetyScreen({ selectedFlags: [], hasUrgentFlag: false });
    router.push('/assessment/symptom');
  };

  const handleStop = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const id = ctx.assessmentId ?? generateId();
    const now = new Date().toISOString();
    await save({
      id,
      createdAt: now,
      updatedAt: now,
      safetyScreen: { selectedFlags: selected, hasUrgentFlag: true },
      classification: 'red',
      classificationReasons: [
        hasEmergencyFlag
          ? 'An emergency-level finding was identified. Seek immediate emergency medical evaluation.'
          : 'An urgent finding was identified. Seek prompt medical evaluation.',
      ],
      modifications: [],
      sessionCheckins: [],
      emergencyStop: true,
    });
    ctx.resetAssessment();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Screen</Text>
        <View style={styles.backBtn} />
      </View>
      <ProgressBar currentStep={1} totalSteps={6} label="Step 1 of 6 — Safety Screen" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.question, { color: colors.foreground }]}>
          Check any of the following that apply right now.
        </Text>
        <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
          Leave unchecked if not present. If none apply, continue to the next step.
        </Text>

        {/* Urgent flags */}
        {URGENT_FLAGS.map(flag => {
          const isSelected = selected.includes(flag.id);
          const isEmergency = flag.level === 'emergency';
          const activeColor = isEmergency ? colors.red : colors.orange;
          const activeBg = isEmergency ? colors.redBg : colors.orangeBg;
          const activeBorder = isEmergency ? colors.redBorder : colors.orangeBorder;
          return (
            <TouchableOpacity
              key={flag.id}
              onPress={() => toggleFlag(flag.id)}
              activeOpacity={0.7}
              style={[
                styles.flagRow,
                {
                  backgroundColor: isSelected ? activeBg : colors.card,
                  borderColor: isSelected ? activeBorder : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              testID={`flag-${flag.id}`}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? activeColor : colors.border,
                    backgroundColor: isSelected ? activeColor : 'transparent',
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.flagLabel, { color: isSelected ? activeColor : colors.foreground }]}>
                  {flag.label}
                </Text>
                {isEmergency && (
                  <Text style={[styles.flagLevel, { color: colors.red }]}>Emergency</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Alert when flags selected */}
        {hasUrgentFlag && (
          <View
            style={[
              styles.stopAlert,
              { backgroundColor: colors.redBg, borderColor: colors.redBorder, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.stopHeader}>
              <Ionicons name="warning" size={22} color={colors.red} />
              <Text style={[styles.stopTitle, { color: colors.red }]}>
                {hasEmergencyFlag ? 'Seek Emergency Medical Evaluation' : 'Seek Medical Evaluation'}
              </Text>
            </View>
            <Text style={[styles.stopBody, { color: colors.foreground }]}>
              {hasEmergencyFlag
                ? 'One or more findings may indicate a condition requiring immediate emergency evaluation.'
                : 'One or more findings suggest this athlete should be evaluated by a medical professional before continuing training.'}
            </Text>
            <Text style={[styles.stopBody, { color: colors.foreground, marginTop: 8 }]}>
              {hasEmergencyFlag
                ? `\u2022 Stop all activity immediately\n\u2022 Call emergency services or go to emergency care\n\u2022 Do not attempt to continue the assessment`
                : `\u2022 Stop training for the affected area\n\u2022 Seek sports medicine or urgent medical evaluation\n\u2022 Do not continue loading or self-testing`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        {hasUrgentFlag ? (
          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: colors.red, borderRadius: colors.radius }]}
            testID="emergency-stop-btn"
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
              {hasEmergencyFlag ? 'Save & Seek Emergency Care' : 'Save & Return to Home'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            testID="safety-continue-btn"
          >
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
              None apply — Continue
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}
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
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  question: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  instruction: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 4 },
  flagRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  flagLevel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  stopAlert: { padding: 16, borderWidth: 1, gap: 8, marginTop: 8 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1 },
  stopBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  bottomBar: { padding: 20, borderTopWidth: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
