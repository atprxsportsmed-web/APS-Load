import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ProgressBarProps {
  currentStep: number; // 1-based
  totalSteps: number;
  label?: string;
}

export function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const colors = useColors();
  const progress = Math.min(currentStep / totalSteps, 1);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.accent,
              width: `${progress * 100}%` as unknown as number,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label ?? `Step ${currentStep} of ${totalSteps}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
