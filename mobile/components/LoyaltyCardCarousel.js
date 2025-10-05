import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (SPACING.lg * 2);
const CARD_HEIGHT = 180;
const STACKED_OFFSET = 100; // How much each card peeks from behind

export default function LoyaltyCardCarousel({ cards }) {
  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardPress = (card) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const renderCard = (card, index) => {
    const isExpanded = selectedCard?.id === card.id;
    
    // Calculate vertical offset for stacking effect
    let topOffset = index * STACKED_OFFSET;
    
    // If a card is expanded, adjust positions
    if (selectedCard) {
      const selectedIndex = cards.findIndex(c => c.id === selectedCard.id);
      if (index < selectedIndex) {
        // Cards before selected stay stacked at top
        topOffset = index * STACKED_OFFSET;
      } else if (index === selectedIndex) {
        // Selected card
        topOffset = selectedIndex * STACKED_OFFSET;
      } else {
        // Cards after selected move down to accommodate expanded card
        topOffset = selectedIndex * STACKED_OFFSET + 450 + (index - selectedIndex) * STACKED_OFFSET;
      }
    }

    return (
      <TouchableOpacity
        key={card.id}
        activeOpacity={0.9}
        onPress={() => handleCardPress(card)}
        style={[
          styles.cardContainer,
          {
            top: topOffset,
            zIndex: isExpanded ? 1000 : index, // First card (index 0) has lowest z-index
          },
        ]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: card.color || COLORS.primary },
            isExpanded && styles.cardContentExpanded,
          ]}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardPoints}>{card.points}</Text>
          </View>

          {/* Collapsed View */}
          {!isExpanded && (
            <View style={styles.cardFooter}>
              <Text style={styles.cardSubtext}>Tap to view details</Text>
            </View>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Progress to Next Reward</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${card.progress || 60}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {card.progress || 60}% complete
                </Text>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{card.visits || '12'}</Text>
                  <Text style={styles.statLabel}>Visits</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{card.rewards || '3'}</Text>
                  <Text style={styles.statLabel}>Rewards</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{card.saved || '$45'}</Text>
                  <Text style={styles.statLabel}>Saved</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailText}>Member since: {card.memberSince || 'Jan 2024'}</Text>
                <Text style={styles.detailText}>Card ID: {card.cardId || '****1234'}</Text>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Full Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate total height needed for all cards
  const containerHeight = selectedCard
    ? cards.findIndex(c => c.id === selectedCard.id) * STACKED_OFFSET + 450 + 
      (cards.length - cards.findIndex(c => c.id === selectedCard.id) - 1) * STACKED_OFFSET + CARD_HEIGHT
    : cards.length * STACKED_OFFSET + CARD_HEIGHT;

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {cards.map((card, index) => renderCard(card, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    left: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContentExpanded: {
    minHeight: 450,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardName: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  cardPoints: {
    fontSize: 28,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardSubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
    borderRadius: BORDER_RADIUS.md,
  },
  progressText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailsSection: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.sm,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
});
