import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Classification } from '@/types/assessment';
import { CLASSIFICATION_INFO } from '@/services/classificationEngine';

interface ClassificationBadgeProps {
  classification: Classification;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Map old 4-color classification to participation decision language
const PARTICIPATION_LABELS: Record<Classification, string> = {
  green: 'Continue',
  yellow: 'Modify',
  orange: 'Change Goal',
  red: 'Stop / Refer',
};

export function ClassificationBadge({
  classification,
  size = 'md',
  showLabel = true,
}: ClassificationBadgeProps) {
  const colors = useColors();
  const info = CLASSIFICATION_INFO[classification];

  const bgColor = {
    green: colors.greenBg,
    yellow: colors.yellowBg,
    orange: colors.orangeBg,
    red: colors.redBg,
  }[classification];

  const textColor = {
    green: colors.green,
    yellow: colors.yellow,
    orange: colors.orange,
    red: colors.red,
  }[classification];

  const borderColor = {
    green: colors.greenBorder,
    yellow: colors.yellowBorder,
    orange: colors.orangeBorder,
    red: colors.redBorder,
  }[classification];

  const iconSize = size === 'lg' ? 24 : size === 'sm' ? 14 : 18;
  const fontSize = size === 'lg' ? 17 : size === 'sm' ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          paddingHorizontal: size === 'lg' ? 16 : size === 'sm' ? 8 : 12,
          paddingVertical: size === 'lg' ? 10 : size === 'sm' ? 4 : 7,
          borderRadius: size === 'lg' ? 12 : 8,
          gap: size === 'sm' ? 4 : 6,
        },
      ]}
    >
      <Ionicons
        name={info.iconName as React.ComponentProps<typeof Ionicons>['name']}
        size={iconSize}
        color={textColor}
      />
      {showLabel && (
        <Text
          style={[styles.label, { color: textColor, fontSize, fontFamily: 'Inter_600SemiBold' }]}
        >
          {PARTICIPATION_LABELS[classification]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    letterSpacing: 0.2,
  },
});
