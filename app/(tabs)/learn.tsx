import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface CardData {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}

interface GlossaryItem {
  term: string;
  definition: string;
}

const EDUCATION_CARDS: CardData[] = [
  {
    id: 'pain_one_point',
    icon: 'analytics-outline',
    title: 'Pain is only one data point',
    body: 'Low pain does not always mean it is safe to continue, and higher pain does not always mean you should stop. What matters more is how your symptoms behave — whether they stay stable, improve, or worsen during movement.',
  },
  {
    id: 'range_of_motion',
    icon: 'body-outline',
    title: 'Range of motion matters',
    body: 'Your ability to move freely through a full range is a better indicator of function than pain alone. Clearly reduced range — even with low pain — often signals something worth addressing before loading.',
  },
  {
    id: 'strength_changes',
    icon: 'barbell-outline',
    title: 'Strength changes matter',
    body: 'A sudden or meaningful reduction in force production is a more significant finding than mild discomfort. Low pain combined with clearly reduced strength warrants a more conservative approach.',
  },
  {
    id: 'symptom_behavior',
    icon: 'trending-down-outline',
    title: 'Symptom behavior under load',
    body: 'How your symptoms respond to controlled loading is one of the most useful pieces of information. Symptoms that remain stable or improve under light load are different from symptoms that escalate.',
  },
  {
    id: 'repeated_movement',
    icon: 'repeat-outline',
    title: 'Improving vs. worsening with movement',
    body: 'Symptoms that loosen up and improve with movement often respond well to a modified session. Symptoms that progressively worsen with each repetition deserve more caution.',
  },
  {
    id: 'next_day',
    icon: 'calendar-outline',
    title: 'The next-day response matters',
    body: 'How you feel 24 hours after training tells you whether the training dose was tolerated. Significant worsening, new swelling, or increased stiffness the next morning are important signals.',
  },
  {
    id: 'modification',
    icon: 'options-outline',
    title: 'Modifying is not the same as stopping',
    body: 'Choosing a modified version of your session keeps you training productively while reducing the demand on an affected area. This is often the most sensible option when function is only mildly limited.',
  },
  {
    id: 'self_assessment',
    icon: 'shield-outline',
    title: 'Self-assessment does not replace diagnosis',
    body: 'This tool helps you make a more structured training decision. It does not determine the cause of your symptoms, and it is not a substitute for evaluation by a licensed healthcare professional.',
  },
];

const GLOSSARY: GlossaryItem[] = [
  {
    term: 'Active range of motion',
    definition: 'The distance and direction you can move a joint using your own muscles, without someone pushing or pulling the limb. It reflects what your body can actively do.',
  },
  {
    term: 'Force production',
    definition: 'Your ability to generate muscular force during a movement or contraction. Reduced force production — even with low pain — can indicate a meaningful functional limitation.',
  },
  {
    term: 'Symptom irritability',
    definition: 'How easily symptoms are provoked and how long they take to settle down. High irritability means symptoms are triggered quickly and take longer to recover.',
  },
  {
    term: 'Controlled loading',
    definition: 'A deliberate, low-threat version of a movement or contraction used to observe how the body responds. The goal is observation, not performance.',
  },
  {
    term: 'Isometric contraction',
    definition: 'A muscle contraction where you produce force without movement — such as pressing your foot into the floor without actually moving. This is a low-threat way to test force production.',
  },
  {
    term: 'Neurological symptoms',
    definition: 'Symptoms arising from nerve involvement — including numbness, tingling, burning, spreading weakness, or loss of coordination. These require prompt evaluation.',
  },
  {
    term: 'Compensation',
    definition: 'Altering movement technique to avoid discomfort or work around a limitation. Compensation is often a sign that the primary pattern is not tolerable at the current load.',
  },
  {
    term: 'Classification (Green / Yellow / Orange / Red)',
    definition: 'A structured summary of the assessment that suggests a training approach. Green = normal monitoring; Yellow = modify; Orange = change the goal; Red = stop and seek evaluation.',
  },
];

function EducationCard({ card }: { card: CardData }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.8}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
          <Ionicons name={card.icon} size={20} color={colors.accent} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.mutedForeground}
        />
      </View>
      {expanded && (
        <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{card.body}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showGlossary, setShowGlossary] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Learn</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Evidence-informed concepts behind the tool
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          KEY CONCEPTS
        </Text>
        {EDUCATION_CARDS.map(card => (
          <EducationCard key={card.id} card={card} />
        ))}

        <TouchableOpacity
          onPress={() => setShowGlossary(g => !g)}
          style={[
            styles.glossaryToggle,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.glossaryToggleText, { color: colors.foreground }]}>
            Clinical Glossary
          </Text>
          <Ionicons
            name={showGlossary ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        {showGlossary &&
          GLOSSARY.map(item => (
            <View
              key={item.term}
              style={[
                styles.glossaryItem,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              <Text style={[styles.glossaryTerm, { color: colors.foreground }]}>{item.term}</Text>
              <Text style={[styles.glossaryDef, { color: colors.mutedForeground }]}>
                {item.definition}
              </Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: {
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  glossaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
  },
  glossaryToggleText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  glossaryItem: {
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 6,
  },
  glossaryTerm: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  glossaryDef: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
});
