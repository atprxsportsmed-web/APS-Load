import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
  multiSelect?: boolean;
}

export function OptionButton({
  label,
  description,
  selected,
  onPress,
  iconName,
  style,
  multiSelect = false,
}: OptionButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: selected ? colors.secondary : colors.card,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: colors.radius,
        },
        style,
      ]}
      testID={`option-${label}`}
    >
      <View style={styles.row}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={selected ? colors.accent : colors.mutedForeground}
            style={styles.icon}
          />
        )}
        <View style={styles.textGroup}>
          <Text
            style={[
              styles.label,
              {
                color: selected ? colors.foreground : colors.foreground,
                fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
              },
            ]}
          >
            {label}
          </Text>
          {description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {description}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            multiSelect ? styles.checkbox : styles.radio,
            {
              borderColor: selected ? colors.accent : colors.border,
              backgroundColor: selected ? colors.accent : 'transparent',
            },
          ]}
        >
          {selected && (
            <Ionicons
              name={multiSelect ? 'checkmark' : 'radio-button-on'}
              size={multiSelect ? 12 : 18}
              color={colors.accentForeground}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 15,
  },
  description: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
