import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import ProgramDetailsScreen from './ProgramDetailsScreen';
import { apiService } from '../lib/api';

export default function BrowseScreen({ visible, onClose, userCards, onAddCard }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPrograms, setAllPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch programs from API
  useEffect(() => {
    if (visible) {
      loadPrograms();
    }
  }, [visible]);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiService.getPrograms();
      if (!error && data?.companies) {
        setAllPrograms(data.companies);
        setFilteredPrograms(data.companies);
      } else {
        console.error('Error loading programs:', error);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredPrograms(allPrograms);
    } else {
      const filtered = allPrograms.filter((program) =>
        program.name.toLowerCase().includes(text.toLowerCase()) ||
        program.category.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPrograms(filtered);
    }
  };

  const isCardAdded = (programId) => {
    // Check by comparing program name since card.id is the reward ID, not company ID
    const program = allPrograms.find(p => p.id === programId);
    return userCards?.some(card => card.name === program?.name);
  };

  const renderProgram = ({ item }) => (
    <TouchableOpacity 
      style={styles.programCard}
      onPress={() => {
        setSelectedProgram(item);
        setDetailsVisible(true);
      }}
    >
      <View>
        <Text style={styles.programName}>{item.name}</Text>
        <Text style={styles.programCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.addButton, isCardAdded(item.id) && styles.addButtonDisabled]}
        onPress={(e) => {
          e.stopPropagation();
          if (!isCardAdded(item.id)) {
            onAddCard?.(item);
          }
        }}
      >
        <Text style={styles.addButtonText}>{isCardAdded(item.id) ? '✓' : '+'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Browse Programs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search for a business..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading programs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPrograms}
            renderItem={renderProgram}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No programs found</Text>
            }
          />
        )}
      </View>
      <ProgramDetailsScreen
        visible={detailsVisible}
        program={selectedProgram}
        onClose={() => setDetailsVisible(false)}
        onAddCard={(program) => {
          onAddCard?.(program);
          setDetailsVisible(false);
        }}
        isAdded={selectedProgram ? isCardAdded(selectedProgram.id) : false}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50, // Add padding for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
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
  searchInput: {
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  programCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  programName: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  programCategory: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    fontWeight: FONTS.weights.bold,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.cardBackground,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});
