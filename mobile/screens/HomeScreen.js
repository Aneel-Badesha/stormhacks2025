import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import LoyaltyCardCarousel from '../components/LoyaltyCardCarousel';

export default function HomeScreen() {
  // Mock data for loyalty cards with more details
  const loyaltyCards = [
    {
      id: '1',
      name: 'Starbucks Rewards',
      points: '450',
      color: '#00704A',
      progress: 75,
      visits: 15,
      rewards: 4,
      saved: '$62',
      memberSince: 'Jan 2023',
      cardId: '****5678',
    },
    {
      id: '2',
      name: 'Tim Hortons',
      points: '230',
      color: '#7a2325',
      progress: 45,
      visits: 8,
      rewards: 2,
      saved: '$28',
      memberSince: 'Mar 2023',
      cardId: '****9012',
    },
    {
      id: '3',
      name: 'Shoppers Optimum',
      points: '12,450',
      color: '#E31837',
      progress: 90,
      visits: 24,
      rewards: 7,
      saved: '$145',
      memberSince: 'Nov 2022',
      cardId: '****3456',
    },
    {
      id: '4',
      name: 'Aeroplan',
      points: '8,920',
      color: '#00205B',
      progress: 65,
      visits: 18,
      rewards: 5,
      saved: '$210',
      memberSince: 'Aug 2022',
      cardId: '****7890',
    },
    {
      id: '5',
      name: 'Best Buy Rewards',
      points: '1,250',
      color: '#0046BE',
      progress: 40,
      visits: 6,
      rewards: 1,
      saved: '$35',
      memberSince: 'Feb 2024',
      cardId: '****2345',
    },
    {
      id: '6',
      name: 'Sephora Beauty Insider',
      points: '3,400',
      color: '#000000',
      progress: 80,
      visits: 22,
      rewards: 6,
      saved: '$98',
      memberSince: 'May 2023',
      cardId: '****6789',
    },
    {
      id: '7',
      name: 'Petro-Points',
      points: '5,670',
      color: '#C8102E',
      progress: 55,
      visits: 31,
      rewards: 8,
      saved: '$156',
      memberSince: 'Dec 2022',
      cardId: '****4567',
    },
    {
      id: '8',
      name: 'Scene+',
      points: '2,890',
      color: '#E4002B',
      progress: 70,
      visits: 14,
      rewards: 4,
      saved: '$72',
      memberSince: 'Apr 2023',
      cardId: '****8901',
    },
    {
      id: '9',
      name: 'Costco Membership',
      points: '890',
      color: '#0066B2',
      progress: 35,
      visits: 9,
      rewards: 2,
      saved: '$124',
      memberSince: 'Jan 2024',
      cardId: '****3210',
    },
    {
      id: '10',
      name: 'Indigo Plum Rewards',
      points: '4,120',
      color: '#6B2D5C',
      progress: 85,
      visits: 19,
      rewards: 5,
      saved: '$89',
      memberSince: 'Oct 2022',
      cardId: '****5432',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Cards</Text>
        <Text style={styles.subtitle}>Swipe to browse your loyalty programs</Text>

        {loyaltyCards.length > 0 ? (
          <LoyaltyCardCarousel cards={loyaltyCards} />
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
