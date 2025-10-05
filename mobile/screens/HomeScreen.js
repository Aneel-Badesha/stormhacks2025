import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import LoyaltyCardCarousel from '../components/LoyaltyCardCarousel';
import { apiService } from '../lib/api';

export default function HomeScreen({ userCards, setUserCards, loading, onRefresh, onDeleteCard }) {
  const [refreshing, setRefreshing] = useState(false);
  const loyaltyCards = userCards || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const handleRedeem = async (card) => {
    const cashValue = card.cash_per_redeem || 5;
    
    Alert.alert(
      '🎁 Redeem Reward',
      `Redeem your reward from ${card.name}?\n\nValue: $${cashValue}\nThis will reset your punch card to 0.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            try {
              const { data, error } = await apiService.redeemReward(card.id);
              
              if (error) {
                Alert.alert('Error', error);
                return;
              }
              
              // Reload user cards from database
              await onRefresh();
              
              Alert.alert('Success!', `Reward redeemed from ${card.name}! 🎉\n\nYou saved $${data.cash_value}!`);
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading && loyaltyCards.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <Text style={styles.title}>My Cards</Text>
        <Text style={styles.subtitle}>Swipe to browse your loyalty programs</Text>

        {loyaltyCards.length > 0 ? (
          <LoyaltyCardCarousel 
            cards={loyaltyCards} 
            onRedeem={handleRedeem}
            onDelete={onDeleteCard}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No loyalty cards yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first card
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: SPACING.lg,
    paddingBottom: 120, // Extra padding for bottom tab bar
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});
