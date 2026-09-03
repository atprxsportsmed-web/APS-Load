import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHistory } from '@/context/HistoryContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { AssessmentHistoryCard } from '@/components/AssessmentHistoryCard';
import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import type { Assessment, Classification } from '@/types/assessment';

// ── Filter types ──────────────────────────────────────────────────────────────

type FilterOption = 'all' | Classification;

const FILTER_OPTS: FilterOption[] = ['all', 'green', 'yellow', 'orange', 'red'];

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  green: 'Continue',
  yellow: 'Modify',
  orange: 'Change Goal',
  red: 'Stop / Refer',
};

// ── Streak detection ──────────────────────────────────────────────────────────
// A "streak" is 2+ consecutive most-recent assessments with the same classification.

function computeCurrentStreak(
  assessments: Assessment[],
): { classification: Classification; count: number } | null {
  if (!assessments.length) return null;
  const first = assessments[0].classification;
  let count = 1;
  for (let i = 1; i < assessments.length; i++) {
    if (assessments[i].classification === first) count++;
    else break;
  }
  return count >= 2 ? { classification: first, count } : null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assessments, isLoading } = useHistory();
  const { isSubscribed } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Classification colour sets (mirrors ClassificationBadge) ───────────────
  const classColors: Record<Classification, { bg: string; border: string; text: string }> = {
    green:  { bg: colors.greenBg,  border: colors.greenBorder,  text: colors.green  },
    yellow: { bg: colors.yellowBg, border: colors.yellowBorder, text: colors.yellow },
    orange: { bg: colors.orangeBg, border: colors.orangeBorder, text: colors.orange },
    red:    { bg: colors.redBg,    border: colors.redBorder,    text: colors.red    },
  };

  // ── Counts across ALL assessments ──────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all:    assessments.length,
      green:  assessments.filter(a => a.classification === 'green').length,
      yellow: assessments.filter(a => a.classification === 'yellow').length,
      orange: assessments.filter(a => a.classification === 'orange').length,
      red:    assessments.filter(a => a.classification === 'red').length,
    }),
    [assessments],
  );

  // ── Streak from full history ───────────────────────────────────────────────
  const streak = useMemo(() => computeCurrentStreak(assessments), [assessments]);

  // ── Free-user paywall (unchanged behaviour) ────────────────────────────────
  // Free users see only the most recent assessment in the list,
  // but see all filter chips and counts.
  const visibleAssessments = isSubscribed ? assessments : assessments.slice(0, 1);
  const hiddenCount = assessments.length - visibleAssessments.length;

  // ── Apply active filter ────────────────────────────────────────────────────
  const filteredAssessments = useMemo(
    () =>
      activeFilter === 'all'
        ? visibleAssessments
        : visibleAssessments.filter(a => a.classification === activeFilter),
    [visibleAssessments, activeFilter],
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Assessment }) => (
    <AssessmentHistoryCard
      assessment={item}
      onPress={() => router.push(`/assessment-detail/${item.id}`)}
    />
  );

  const renderChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContent}
      style={styles.chipsRow}
    >
      {FILTER_OPTS.map(opt => {
        const isActive = activeFilter === opt;
        const clr = opt !== 'all' ? classColors[opt] : null;
        const count = counts[opt];

        const chipBg     = isActive && clr ? clr.bg     : isActive ? colors.primary + '18' : colors.muted;
        const chipBorder = isActive && clr ? clr.border : isActive ? colors.primary        : colors.border;
        const chipText   = isActive && clr ? clr.text   : isActive ? colors.primary        : colors.mutedForeground;

        return (
          <TouchableOpacity
            key={opt}
            onPress={() => setActiveFilter(opt)}
            activeOpacity={0.75}
            style={[styles.chip, { backgroundColor: chipBg, borderColor: chipBorder }]}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: chipText,
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              {FILTER_LABELS[opt]}
            </Text>
            <View
              style={[
                styles.chipBubble,
                { backgroundColor: isActive && clr ? clr.text + '28' : colors.border },
              ]}
            >
              <Text style={[styles.chipBubbleText, { color: chipText }]}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderStreakBanner = () => {
    // Only show streak when viewing "All" and streak is meaningful
    if (!streak || activeFilter !== 'all') return null;
    const clr = classColors[streak.classification];
    const label = FILTER_LABELS[streak.classification];
    return (
      <View
        style={[
          styles.streakBanner,
          { backgroundColor: clr.bg, borderColor: clr.border },
        ]}
      >
        <Ionicons name="trending-up" size={15} color={clr.text} />
        <Text style={[styles.streakText, { color: clr.text }]}>
          {streak.count} sessions in a row — {label}
        </Text>
      </View>
    );
  };

  const emptyLabel =
    activeFilter === 'all'
      ? 'No assessments yet'
      : `No ${FILTER_LABELS[activeFilter]} sessions`;

  const emptyBody =
    activeFilter === 'all'
      ? 'Complete a check-in from the Home tab to see it here.'
      : `You don\u2019t have any sessions with a \u201c${FILTER_LABELS[activeFilter]}\u201d recommendation yet.`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Paywall modal */}
      <Modal visible={showPaywall} animationType="slide" statusBarTranslucent>
        <SubscriptionPaywall onDismiss={() => setShowPaywall(false)} />
      </Modal>

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isSubscribed
            ? `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`
            : assessments.length > 0
            ? 'Most recent — subscribe for full history'
            : '0 assessments'}
        </Text>

        {/* Filter chips — visible to all users */}
        {renderChips()}
      </View>

      <FlatList
        data={filteredAssessments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!filteredAssessments.length}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 100 },
          !filteredAssessments.length && !hiddenCount && styles.emptyList,
        ]}
        ListHeaderComponent={renderStreakBanner}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Feather name="clipboard" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{emptyLabel}</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{emptyBody}</Text>
            </View>
          )
        }
        ListFooterComponent={
          !isSubscribed && hiddenCount > 0 ? (
            <TouchableOpacity
              style={[styles.proCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowPaywall(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.proIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.proText}>
                <Text style={[styles.proTitle, { color: colors.foreground }]}>
                  {hiddenCount} more assessment{hiddenCount !== 1 ? 's' : ''} locked
                </Text>
                <Text style={[styles.proBody, { color: colors.mutedForeground }]}>
                  Subscribe to access your full history and sync across devices.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },

  // Filter chips
  chipsRow: { marginTop: 14, marginHorizontal: -20 },
  chipsContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 13 },
  chipBubble: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  chipBubbleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Streak banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  streakText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // List
  list: { paddingTop: 16 },
  emptyList: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyBody: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },

  // Paywall card
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  proIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  proText: { flex: 1, gap: 2 },
  proTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  proBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
