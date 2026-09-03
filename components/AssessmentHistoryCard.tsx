import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Assessment } from '@/types/assessment';
import { BODY_REGIONS } from '@/types/assessment';
import { ClassificationBadge } from './ClassificationBadge';

interface AssessmentHistoryCardProps {
  assessment: Assessment;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AssessmentHistoryCard({ assessment, onPress }: AssessmentHistoryCardProps) {
  const colors = useColors();

  const regionLabel =
    BODY_REGIONS.find(r => r.value === assessment.symptomContext?.bodyRegion)?.label ??
    'General';

  const hasFollowUp = !!assessment.followUp;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      testID="assessment-history-card"
    >
      <View style={styles.header}>
        <ClassificationBadge classification={assessment.classification} size="sm" />
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(assessment.createdAt)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.region, { color: colors.foreground }]}>{regionLabel}</Text>
        {assessment.symptomContext?.activity ? (
          <Text style={[styles.activity, { color: colors.mutedForeground }]} numberOfLines={1}>
            {assessment.symptomContext.activity}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.tags}>
          {assessment.modifications.length > 0 && (
            <View style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                {assessment.modifications.length} modification
                {assessment.modifications.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {hasFollowUp && (
            <View style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                Follow-up done
              </Text>
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  body: {
    gap: 2,
  },
  region: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  activity: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
