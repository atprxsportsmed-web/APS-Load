import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  apiGetSubscriptionPrice,
  apiCreateCheckoutSession,
  type PriceRow,
  type PriceResponse,
} from '@/services/subscriptionApi';

function buildFeatures(trialDays: number | null) {
  return [
    { icon: 'time-outline' as const,        label: 'Full assessment history — every session saved' },
    { icon: 'sync-outline' as const,        label: 'Cross-device sync — start on one device, review on another' },
    { icon: 'trending-up-outline' as const, label: 'Progress tracking — see trends over time' },
    {
      icon: 'shield-checkmark-outline' as const,
      label: trialDays
        ? `${trialDays}-day free trial — cancel anytime`
        : 'Free trial — cancel anytime',
    },
  ];
}

interface Props {
  onDismiss?: () => void;
  /** If true, user tapped "Continue free" is not allowed (hard gate) */
  required?: boolean;
}

export default function SubscriptionPaywall({ onDismiss, required = false }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refresh } = useSubscription();
  const [priceData, setPriceData] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    apiGetSubscriptionPrice()
      .then(setPriceData)
      .catch(() => setPriceData(null))
      .finally(() => setLoading(false));
  }, []);

  const trialDays = priceData?.trial_period_days ?? 7;
  const FEATURES = buildFeatures(trialDays);
  const monthlyPrice = priceData?.data.find((p) => p.recurring?.interval === 'month');
  const priceDisplay = monthlyPrice
    ? `$${(monthlyPrice.unit_amount / 100).toFixed(2)}/month`
    : '$19.99/month';

  const handleSubscribe = async () => {
    if (!monthlyPrice?.price_id) {
      Alert.alert('Error', 'Could not load subscription details. Please try again.');
      return;
    }
    setSubscribing(true);
    try {
      const url = await apiCreateCheckoutSession(monthlyPrice.price_id);
      await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
      // After browser closes, refresh subscription status
      await refresh();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not open checkout. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="star" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Pro Membership</Text>
        </View>

        <Text style={[styles.headline, { color: colors.foreground }]}>
          Unlock your full{'\n'}athlete profile
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {loading ? 'Loading…' : `Start free for 7 days, then ${priceDisplay}`}
        </Text>

        {/* Feature list */}
        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={f.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary, opacity: subscribing ? 0.75 : 1 }]}
          onPress={handleSubscribe}
          disabled={subscribing || loading}
          activeOpacity={0.85}
        >
          {subscribing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          No charge for 7 days. Cancel anytime before trial ends.
        </Text>

        {!required && onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>
              Continue with limited access
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 0 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  headline: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10,
  },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 28 },
  featureCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  cta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 14,
    marginBottom: 12,
  },
  ctaText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  legal: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 20 },
  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 14, fontFamily: 'Inter_400Regular', textDecorationLine: 'underline' },
});
