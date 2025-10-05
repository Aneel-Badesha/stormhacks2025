import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import ProgramDetailsScreen from '../screens/ProgramDetailsScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (SPACING.lg * 2);
const CARD_HEIGHT = 180;
const STACKED_OFFSET = 100; // How much each card peeks from behind

export default function LoyaltyCardCarousel({ cards, onAddCard, onRedeem }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const handleCardPress = (card) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  // Small compact dots for header (next to card name)
  const renderCompactDots = (punches, maxPunches) => {
    const dots = [];
    const dotSize = 6;
    const dotSpacing = 3;
    
    for (let i = 0; i < maxPunches; i++) {
      const isFilled = i < punches;
      dots.push(
        <View
          key={i}
          style={[
            styles.punchDot,
            {
              width: dotSize,
              height: dotSize,
              marginHorizontal: dotSpacing / 2,
              backgroundColor: isFilled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        />
      );
    }
    
    return <View style={styles.punchRow}>{dots}</View>;
  };

  // Large expanded dots with logos for filled punches
  const renderExpandedPunchCard = (punches, maxPunches, cardName) => {
    const dots = [];
    const dotSize = 40;
    const dotSpacing = 8;
    
    // For 10 punches, show as 2x5 grid
    if (maxPunches === 10) {
      return (
        <View style={styles.expandedPunchGrid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.expandedPunchRow}>
              {[0, 1, 2, 3, 4].map((col) => {
                const index = row * 5 + col;
                const isFilled = index < punches;
                return (
                  <View
                    key={index}
                    style={[
                      styles.expandedPunchDot,
                      {
                        width: dotSize,
                        height: dotSize,
                        marginHorizontal: dotSpacing / 2,
                        marginVertical: dotSpacing / 2,
                        backgroundColor: isFilled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                      },
                    ]}
                  >
                    {isFilled && (
                      <Text style={styles.punchLogo}>{getCardEmoji(cardName)}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      );
    }
    
    // For other amounts, show in rows (wrap if needed)
    const dotsPerRow = Math.min(maxPunches, 5);
    const numRows = Math.ceil(maxPunches / dotsPerRow);
    
    return (
      <View style={styles.expandedPunchGrid}>
        {Array.from({ length: numRows }).map((_, row) => (
          <View key={row} style={styles.expandedPunchRow}>
            {Array.from({ length: dotsPerRow }).map((_, col) => {
              const index = row * dotsPerRow + col;
              if (index >= maxPunches) return null;
              const isFilled = index < punches;
              return (
                <View
                  key={index}
                  style={[
                    styles.expandedPunchDot,
                    {
                      width: dotSize,
                      height: dotSize,
                      marginHorizontal: dotSpacing / 2,
                      marginVertical: dotSpacing / 2,
                      backgroundColor: isFilled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                >
                  {isFilled && (
                    <Text style={styles.punchLogo}>{getCardEmoji(cardName)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // Get emoji/logo for each card
  const getCardEmoji = (cardName) => {
    const emojiMap = {
      'Starbucks Rewards': '☕',
      'Tim Hortons': '🍩',
      'Shoppers Optimum': '💊',
      'Aeroplan': '✈️',
      'Best Buy Rewards': '🔌',
      'Sephora Beauty Insider': '💄',
      'Petro-Points': '⛽',
      'Scene+': '🎬',
      'Costco Membership': '🛒',
      'Indigo Plum Rewards': '📚',
    };
    return emojiMap[cardName] || '⭐';
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
            zIndex: isExpanded ? 1000 : index + 1,
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: card.color || COLORS.primary,
            },
            isExpanded && styles.cardExpanded,
          ]}
        >
          {/* Card Header with Compact Dots */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{card.name}</Text>
            {renderCompactDots(card.punches || 0, card.maxPunches || 10)}
          </View>

          {/* Expanded Punch Card - Only visible when expanded */}
          {isExpanded && (
            <View style={styles.expandedPunchCardContainer}>
              {renderExpandedPunchCard(card.punches || 0, card.maxPunches || 10, card.name)}
              <Text style={styles.punchText}>
                {card.punches || 0} / {card.maxPunches || 10} punches
              </Text>
            </View>
          )}

          {/* Collapsed View */}
          {!isExpanded && (
            <View style={styles.cardFooter}>
              <Text style={styles.cardSubtext}>Tap to view details</Text>
            </View>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <View style={styles.expandedContent}>
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

              {/* Redeem Button - Only show if card is full */}
              {card.punches >= card.maxPunches && (
                <TouchableOpacity 
                  style={styles.redeemButton}
                  onPress={() => {
                    if (onRedeem) {
                      onRedeem(card);
                    }
                  }}
                >
                  <Text style={styles.redeemButtonText}>🎁 Redeem Reward</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setSelectedProgram(card);
                  setDetailsVisible(true);
                }}
              >
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
    <>
      <View style={[styles.container, { height: containerHeight }]}>
        {cards.map((card, index) => renderCard(card, index))}
      </View>
      <ProgramDetailsScreen
        visible={detailsVisible}
        program={selectedProgram}
        onClose={() => setDetailsVisible(false)}
        onAddCard={onAddCard}
        isAdded={true} // Card is already added since it's in the carousel
      />
    </>
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
    borderWidth: 2,
    borderColor: '#1A2F4F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardExpanded: {
    minHeight: 'auto',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardName: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  punchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  punchDot: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  expandedPunchCardContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  expandedPunchGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedPunchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedPunchDot: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  punchLogo: {
    fontSize: 24,
  },
  punchText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    opacity: 0.9,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardSubtext: {
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
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  redeemButton: {
    backgroundColor: '#FFD700',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  redeemButtonText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: '#000000',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
});
