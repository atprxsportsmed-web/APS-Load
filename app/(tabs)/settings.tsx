import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHistory } from '@/context/HistoryContext';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assessments, clearAll } = useHistory();
  const [clearing, setClearing] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleClearData = () => {
    Alert.alert(
      'Delete All Data',
      `This will permanently delete all ${assessments.length} saved assessment${assessments.length !== 1 ? 's' : ''}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setClearing(true);
            await clearAll();
            setClearing(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Data & Privacy */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DATA & PRIVACY
        </Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.row}>
            <Feather name="database" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Storage</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} stored on this device
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Feather name="lock" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Data Location</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                All data is stored locally on your device. Nothing is sent to external servers.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Feather name="eye-off" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Analytics</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                No health information, symptom responses, or assessment results are tracked.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClearData}
          disabled={clearing || assessments.length === 0}
          activeOpacity={0.7}
          style={[
            styles.destructiveBtn,
            {
              backgroundColor: colors.card,
              borderColor: assessments.length === 0 ? colors.border : colors.redBorder,
              borderRadius: colors.radius,
              opacity: assessments.length === 0 ? 0.5 : 1,
            },
          ]}
          testID="delete-all-btn"
        >
          <Feather
            name="trash-2"
            size={18}
            color={assessments.length === 0 ? colors.mutedForeground : colors.red}
          />
          <Text
            style={[
              styles.destructiveBtnText,
              { color: assessments.length === 0 ? colors.mutedForeground : colors.red },
            ]}
          >
            {clearing ? 'Deleting...' : 'Delete All Data'}
          </Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Purpose</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                A structured decision-support tool to help athletes choose a safe and productive version of their training session.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="medical-outline" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Medical Disclaimer</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                This tool supports training decisions. It does not diagnose injuries, determine whether you are injured, or replace evaluation by a licensed healthcare professional.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Clinical Review</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                Clinical decision rules in this tool require review by a qualified healthcare professional before any clinical or public deployment.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.versionBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            ATPRX Athlete Center — v1.0.0
          </Text>
        </View>
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
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  group: {
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  rowIcon: { marginTop: 2 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  rowDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  divider: { height: 1, marginHorizontal: 16 },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  destructiveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  versionBox: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
