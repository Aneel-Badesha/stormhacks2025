import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import LoyaltyCardCarousel from '../components/LoyaltyCardCarousel';
import { INITIAL_USER_CARDS } from '../data/mockData';

export default function HomeScreen({ userCards, setUserCards }) {
  // Use prop or fallback to initial data
  const loyaltyCards = userCards || INITIAL_USER_CARDS;

  const handleRedeem = (card) => {
    const cashValue = card.cash_per_redeem || 5;
    
    Alert.alert(
      '🎁 Redeem Reward',
      `Redeem your reward from ${card.name}?\n\nValue: $${cashValue}\nThis will reset your punch card to 0.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: () => {
            // Reset punches to 0, increment rewards, and add to saved amount
            const updatedCards = userCards.map(c => {
              if (c.id === card.id) {
                // Parse current saved amount and add new value
                const currentSaved = parseFloat(c.saved?.replace('$', '') || '0');
                const newSaved = currentSaved + cashValue;
                
                return {
                  ...c,
                  punches: 0,
                  rewards: (c.rewards || 0) + 1,
                  saved: `$${newSaved.toFixed(0)}`,
                };
              }
              return c;
            });
            setUserCards(updatedCards);
            Alert.alert('Success!', `Reward redeemed from ${card.name}! 🎉\n\nYou saved $${cashValue}!`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Cards</Text>
        <Text style={styles.subtitle}>Swipe to browse your loyalty programs</Text>

        {loyaltyCards.length > 0 ? (
          <LoyaltyCardCarousel cards={loyaltyCards} onRedeem={handleRedeem} />
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
});
