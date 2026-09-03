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
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHistory } from '@/context/HistoryContext';
import { useAssessment } from '@/context/AssessmentContext';
import { AssessmentHistoryCard } from '@/components/AssessmentHistoryCard';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assessments } = useHistory();
  const { startAssessment } = useAssessment();

  const recent = assessments.slice(0, 3);

  const handleStartAssessment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startAssessment();
    router.push('/assessment/');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#0D2137', '#1A4A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.headerLogo}
          contentFit="contain"
        />
        <Text style={styles.appSubtitle}>Keeping Athletes in Motion</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA card */}
        <View
          style={[
            styles.ctaCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.ctaBody, { color: colors.foreground, fontWeight: 'bold', marginBottom: 12 }]}>
            The ATPRX Athlete Center Tool helps you quickly assess how an athlete is moving, tolerating load, and responding to activity so you can decide whether today&apos;s training should continue, be modified, change direction, or stop.
          </Text>
          <Text style={[styles.ctaBody, { color: colors.mutedForeground }]}>
            It does not diagnose injuries or replace medical care. It helps you make a more consistent, informed decision about what the athlete can do today—and when it&apos;s time to refer out.
          </Text>

          <TouchableOpacity
            onPress={handleStartAssessment}
            activeOpacity={0.85}
            style={[styles.startBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            testID="start-assessment-btn"
          >
            <Ionicons name="play-circle" size={22} color={colors.primaryForeground} />
            <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
              Start Check-In
            </Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
          {STEPS.map((step, i) => (
            <View
              key={step.label}
              style={[
                styles.stepRow,
                { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <View style={[styles.stepNumber, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.stepNumText, { color: colors.accent }]}>{i + 1}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent assessments */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recent.map(a => (
              <AssessmentHistoryCard
                key={a.id}
                assessment={a}
                onPress={() => router.push(`/assessment-detail/${a.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const STEPS = [
  { label: 'Safety Screen', desc: 'Check for symptoms requiring immediate care' },
  { label: 'Symptom Context', desc: 'Describe what you are experiencing' },
  { label: 'Movement Assessment', desc: 'Evaluate your active range of motion' },
  { label: 'Controlled Load Test', desc: 'Observe response to light, controlled loading' },
  { label: 'Reassessment', desc: 'Compare before and after' },
  { label: 'Training Recommendation', desc: 'Get a clear, practical decision' },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerLogo: {
    width: 240,
    height: 84,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    gap: 0,
  },
  ctaCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  ctaHeadline: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 26,
  },
  ctaBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 17,
  },
  section: {
    marginBottom: 24,
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  stepText: { flex: 1, gap: 2 },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
