import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'body-outline' as const,
    color: '#3B82F6',
    bg: '#EFF6FF',
    title: 'Your Personal Athlete Health Hub',
    body: `ATPRX Athlete Center is a clinical-grade self-assessment tool built by sports medicine professionals. It helps you track training load, monitor symptoms, and make smart return-to-play decisions \u2014 right from your phone.`,
  },
  {
    icon: 'barbell-outline' as const,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Isometric Testing Series',
    body: `Our isometric testing protocol measures your functional strength at key joints. You'll hold a position against resistance for a timed effort \u2014 no equipment needed. The results feed directly into your load score and flag asymmetries that predict injury risk.`,
  },
  {
    icon: 'clipboard-outline' as const,
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Run a Self-Evaluation',
    body: `Start a Check-In from the Home tab. You'll answer a brief safety screen, describe any symptoms, then complete the isometric series. The app scores each session and tells you whether it's safe to train, modify, or rest \u2014 with a plain-language explanation.`,
  },
  {
    icon: 'medical-outline' as const,
    color: '#EF4444',
    bg: '#FEF2F2',
    title: 'Know When to See a Doctor',
    body: `Not every ache needs a clinic visit \u2014 but some do. ATPRX flags red-light symptoms that require professional evaluation, and gives you clear guidance on when to schedule an appointment. When in doubt, always consult a qualified sports medicine provider.`,
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * W, animated: true });
    setPage(idx);
  };

  const next = () => {
    if (page < SLIDES.length - 1) goTo(page + 1);
    else onComplete();
  };

  const slide = SLIDES[page];
  const isLast = page === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scroller}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: W }]}>
            <View style={[styles.iconCircle, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={64} color={s.color} />
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? colors.primary : colors.border,
                  width: i === page ? 20 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {page < SLIDES.length - 1 && (
          <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons
            name={isLast ? 'checkmark' : 'arrow-forward'}
            size={18}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroller: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  slideBody: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  skipBtn: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
