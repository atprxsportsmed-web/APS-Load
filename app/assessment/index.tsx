import React from 'react';
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
import * as Haptics from 'expo-haptics';

const STEPS = [
  { icon: 'shield-checkmark-outline' as const, label: 'Safety Screen', desc: 'Identify any symptoms requiring immediate care' },
  { icon: 'body-outline' as const, label: 'Symptom Context', desc: 'Describe the location, onset, and nature of your symptoms' },
  { icon: 'move-outline' as const, label: 'Movement Assessment', desc: 'Evaluate your active range of motion' },
  { icon: 'fitness-outline' as const, label: 'Controlled Load Test', desc: 'Observe how your body responds to light loading' },
  { icon: 'reload-outline' as const, label: 'Reassessment', desc: 'Compare function before and after the test' },
  { icon: 'checkmark-circle-outline' as const, label: 'Recommendation', desc: 'Receive a structured training decision' },
];

export default function AssessmentStartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/assessment/safety');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            backgroundColor: colors.primary,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-In</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Before you begin
          </Text>
          <Text style={[styles.subheadline, { color: colors.mutedForeground }]}>
            This check-in takes 3–5 minutes. It will guide you through a structured assessment to help you choose the safest and most productive version of today's training.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Ionicons name="information-circle" size={20} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            This tool supports training decisions. It does not diagnose injuries or replace evaluation by a licensed healthcare professional.
          </Text>
        </View>

        {/* Steps overview */}
        <Text style={[styles.stepsTitle, { color: colors.foreground }]}>What to expect</Text>
        {STEPS.map((step, i) => (
          <View
            key={step.label}
            style={[
              styles.stepRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={[styles.stepNum, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.stepNumText, { color: colors.accent }]}>{i + 1}</Text>
            </View>
            <Ionicons name={step.icon} size={20} color={colors.accent} />
            <View style={styles.stepTextGroup}>
              <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* Tips */}
        <View
          style={[
            styles.tipsBox,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Before you start</Text>
          {[
            'Have access to the area you want to assess',
            'Be in a space where you can move safely',
            'Be honest — this tool works on what you actually observe',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark" size={14} color={colors.accent} />
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleBegin}
          activeOpacity={0.85}
          style={[
            styles.beginBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          testID="begin-assessment-btn"
        >
          <Text style={[styles.beginBtnText, { color: colors.primaryForeground }]}>
            Begin Assessment
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  intro: { gap: 8 },
  headline: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  stepsTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  stepTextGroup: { flex: 1 },
  stepLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stepDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  tipsBox: { padding: 16, borderWidth: 1, gap: 10 },
  tipsTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  beginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
  },
  beginBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
});
