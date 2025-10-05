import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function ProgramDetailsScreen({ visible, program, onClose, onAddCard, isAdded }) {
  const insets = useSafeAreaInsets();
  
  if (!program) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.headerContainer}>
          <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Company Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: program.color || COLORS.primary }]}>
              <Text style={styles.logoText}>
                {program.name?.charAt(0).toUpperCase() || 'L'}
              </Text>
            </View>
          </View>

          {/* Company Name */}
          <Text style={styles.companyName}>{program.name}</Text>

          {/* Company Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {program.name}</Text>
            <Text style={styles.description}>
              {program.companyDescription || 
                `${program.name} is a leading company dedicated to providing exceptional products and services to customers. With a commitment to quality and customer satisfaction, they continue to innovate and deliver value.`}
            </Text>
          </View>

          {/* Rewards Program Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rewards Program</Text>
            <Text style={styles.description}>
              {program.programDescription || 
                `Join the ${program.name} rewards program and start earning points with every purchase. Enjoy exclusive benefits, special offers, and redeem your points for amazing rewards. Members get access to personalized deals and early access to new products.`}
            </Text>
          </View>

          {/* Program Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Benefits</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Earn points on every purchase</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Exclusive member-only offers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Birthday rewards and surprises</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Early access to sales and events</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Free to join, easy to use</Text>
              </View>
            </View>
          </View>

          {/* Program Stats (if already added) */}
          {isAdded && program.points && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Progress</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{program.points}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{program.visits || '0'}</Text>
                  <Text style={styles.statLabel}>Visits</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{program.rewards || '0'}</Text>
                  <Text style={styles.statLabel}>Rewards</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Add to Cards Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <TouchableOpacity
            style={[styles.addButton, isAdded && styles.addButtonDisabled]}
            onPress={() => {
              if (!isAdded) {
                onAddCard(program);
              }
            }}
            disabled={isAdded}
          >
            <Text style={styles.addButtonText}>
              {isAdded ? '✓ Already in Your Cards' : 'Add to My Cards'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingTop: '0px'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  companyName: {
    fontSize: 32,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  benefitsList: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitIcon: {
    fontSize: 18,
    color: COLORS.accent,
    marginRight: SPACING.md,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statsCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.cardBackground,
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
});
