import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import BrowseScreen from './screens/BrowseScreen';
import { COLORS, FONTS } from './constants/theme';
import { parseStaticTag, validateUserHasCard, awardPunches } from './utils/staticNfcEncoder';
import { apiService } from './lib/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { user, flaskSynced } = useAuth();
  const [browseVisible, setBrowseVisible] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPrograms, setAllPrograms] = useState([]);
  const insets = useSafeAreaInsets();
  
  // Use refs to always have latest values in handleDeepLink
  const userCardsRef = React.useRef(userCards);
  const allProgramsRef = React.useRef(allPrograms);
  
  React.useEffect(() => {
    userCardsRef.current = userCards;
  }, [userCards]);
  
  React.useEffect(() => {
    allProgramsRef.current = allPrograms;
  }, [allPrograms]);

  // Fetch user cards and programs after Flask sync completes
  useEffect(() => {
    if (flaskSynced) {
      loadUserData();
    }
  }, [flaskSynced]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Fetch user cards
      const { data: cardsData, error: cardsError } = await apiService.getUserCards();
      if (!cardsError && cardsData?.cards) {
        setUserCards(cardsData.cards);
      } else {
        console.error('Error loading user cards:', cardsError);
      }

      // Fetch all programs for deep link validation
      const { data: programsData, error: programsError } = await apiService.getPrograms();
      if (!programsError && programsData?.companies) {
        setAllPrograms(programsData.companies);
      } else {
        console.error('Error loading programs:', programsError);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = React.useCallback(({ url }, retryCount = 0) => {
    console.log('Deep link received:', url);
    console.log('allProgramsRef length:', allProgramsRef.current.length);
    console.log('userCards length:', userCardsRef.current.length);
    
    const result = parseStaticTag(url);
    
    if (result.error) {
      // Don't show alert for silent errors (like base URL without params)
      if (!result.silent) {
        Alert.alert('Scan Error', result.error);
      }
      return;
    }
    
    console.log('Parsed result:', result);
    
    // Guard: Wait for programs to load before processing scan (max 10 retries = 5 seconds)
    if (allProgramsRef.current.length === 0) {
      if (retryCount < 10) {
        console.log(`Programs not loaded yet, waiting... (retry ${retryCount + 1}/10)`);
        setTimeout(() => {
          handleDeepLink({ url }, retryCount + 1); // Retry with incremented count
        }, 500);
      } else {
        console.error('Failed to load programs after 10 retries');
        Alert.alert('Error', 'Failed to load programs. Please try again.');
      }
      return;
    }
    
    console.log('All programs:', allProgramsRef.current.map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
    console.log('Looking for programId:', result.programId, 'Type:', typeof result.programId);
    
    // Find the program (use ref for latest value)
    // Use loose equality (==) to handle string/number mismatch
    const program = allProgramsRef.current.find(p => p.id == result.programId);
    console.log('Found program:', program?.name);
    
    if (!program) {
      setTimeout(() => {
        Alert.alert('Error', `Program not found for ID: ${result.programId}\n\nAvailable IDs: ${allProgramsRef.current.map(p => p.id).join(', ')}`);
      }, 100);
      return;
    }
    
    // Check if user has the card (check by company name since card.id is reward ID)
    const hasCard = userCardsRef.current.some(card => card.name === program.name);
    console.log('Has card?', hasCard);
    
    if (!hasCard) {
      console.log('User does not have card, showing alert');
      
      // Use setTimeout to ensure alert shows (in case another alert is showing)
      setTimeout(() => {
        Alert.alert(
          'Card Not Found',
          `You don't have a ${program.name} card yet. Would you like to add it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Add Card', 
              onPress: async () => {
                console.log('User chose to add card');
                await handleAddCard(program);
                
                // After adding card, award the first punch
                console.log('Card added, now awarding first punch...');
                
                // Get user ID from session
                const { data: sessionData } = await apiService.getSession();
                const userId = sessionData?.user?.id;
                
                if (userId) {
                  const { data, error } = await apiService.scanNFC({
                    user_id: userId,
                    company_id: parseInt(result.programId),
                  });
                  
                  if (!error && data) {
                    await loadUserData(); // Refresh cards
                    Alert.alert(
                      '🎉 Card Added & Punch Awarded!',
                      `${program.name} card added to your wallet!\n\nFirst punch awarded: 1/${data.target_score}`,
                      [{ text: 'Awesome!', style: 'default' }]
                    );
                  }
                }
              }
            },
          ],
          { cancelable: true }
        );
      }, 100);
      return;
    }
    
    // Check if card is already at max punches
    const currentCard = userCardsRef.current.find(card => card.name === program.name);
    const currentPunches = currentCard?.punches || 0;
    const maxPunches = currentCard?.maxPunches || 10;
    const isAtMax = currentPunches >= maxPunches;
    
    console.log(`Card check: ${currentPunches}/${maxPunches} punches, isAtMax: ${isAtMax}`);
    
    if (isAtMax) {
      // Card is full - don't award punch, show redeem message
      console.log('⚠️ Card at max punches - must redeem first');
      
      setTimeout(() => {
        Alert.alert(
          '🎁 Card Full!',
          `Your ${program.name} card is full (${maxPunches}/${maxPunches})!\n\nPlease redeem your reward before earning more punches.`,
          [{ text: 'Got it!', style: 'default' }],
          { cancelable: true }
        );
      }, 150);
      return;
    }
    
    // Call backend API to increment score
    const scanNFC = async () => {
      try {
        // The backend uses session cookies, but we need to pass user_id for the scan endpoint
        // Get it from the current card since we know the user has it
        const currentCard = userCardsRef.current.find(card => card.name === program.name);
        
        if (!currentCard) {
          Alert.alert('Error', 'Card not found in your wallet');
          return;
        }
        
        // We need to get the user_id - let's fetch it from the session endpoint
        const { data: sessionData } = await apiService.getSession();
        const userId = sessionData?.user?.id;
        
        if (!userId) {
          Alert.alert('Error', 'User not authenticated. Please log in again.');
          return;
        }
        
        const { data, error } = await apiService.scanNFC({
          user_id: userId,
          company_id: parseInt(result.programId),
        });
        
        if (error) {
          Alert.alert('Scan Error', error);
          return;
        }
        
        // Refresh user cards to get updated data from backend
        await loadUserData();
        
        // Show success alert
        const punchText = result.points === 1 ? 'punch' : 'punches';
        console.log('✅ SUCCESS: Punch awarded!');
        console.log(`+${result.points} ${punchText} added to ${program.name}`);
        
        setTimeout(() => {
          Alert.alert(
            '🎉 Punch Added!',
            `+${result.points} ${punchText} added to ${program.name}\n\nPunch count: ${data.new_score}/${data.target_score}`,
            [{ text: 'Awesome!', style: 'default' }],
            { cancelable: true }
          );
        }, 100);
      } catch (error) {
        console.error('Error scanning NFC:', error);
        Alert.alert('Error', 'Failed to process scan. Please try again.');
      }
    };
    
    scanNFC();
  }, [allPrograms, user, loadUserData]); // Depend on allPrograms, user, and loadUserData

  // Deep link handler for NFC auto-open
  useEffect(() => {
    console.log('Setting up deep link listeners...');
    let hasProcessedInitialUrl = false;
    
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL event received:', event);
      handleDeepLink(event);
    });
    
    // Handle deep links when app opens from closed state (only once)
    Linking.getInitialURL().then((url) => {
      console.log('Initial URL:', url);
      // Only process if it has NFC scan parameters (programId) and hasn't been processed yet
      if (url && url.includes('programId=') && !hasProcessedInitialUrl) {
        hasProcessedInitialUrl = true;
        console.log('Processing initial NFC scan URL');
        handleDeepLink({ url });
      } else if (url && url.includes('?')) {
        console.log('Initial URL has query params but no programId, ignoring:', url);
      }
    });
    
    return () => {
      console.log('Removing deep link listener');
      subscription.remove();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleAddCard = async (program) => {
    // Check if card already exists
    if (userCardsRef.current.some(card => card.name === program.name)) {
      Alert.alert('Already Added', `You already have a ${program.name} card.`);
      return;
    }
    
    try {
      // Call API to create the card in the database
      const { data, error } = await apiService.createUserCard(program.id);
      
      if (error) {
        Alert.alert('Error', error || 'Failed to add card');
        return;
      }
      
      if (data?.card) {
        // Add the new card to state
        setUserCards([...userCardsRef.current, data.card]);
        // Alert.alert('Success!', `${program.name} card added! 🎉`);
      }
    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Failed to add card. Please try again.');
    }
  };

  const handleDeleteCard = async (card) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to remove your ${card.name} card? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await apiService.deleteUserCard(card.id);
              
              if (error) {
                Alert.alert('Error', error || 'Failed to delete card');
                return;
              }
              
              // Remove card from state
              setUserCards(userCardsRef.current.filter(c => c.id !== card.id));
              Alert.alert('Deleted', `${card.name} card removed.`);
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.cardBackground,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: insets.bottom,
            paddingTop: 10,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontFamily: FONTS.regular,
            fontSize: 12,
            fontWeight: FONTS.weights.medium,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarIcon: ({ color, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, color }}>🏠</Text>
              </View>
            ),
          }}
        >
          {(props) => (
            <HomeScreen 
              {...props} 
              userCards={userCards} 
              setUserCards={setUserCards}
              loading={loading}
              onRefresh={loadUserData}
              onDeleteCard={handleDeleteCard}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Browse"
          component={View}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setBrowseVisible(true);
            },
          }}
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text style={{ fontSize: 32, color: COLORS.textPrimary, fontWeight: 'bold' }}>+</Text>
              </View>
            ),
            tabBarLabel: '',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, color }}>👤</Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <BrowseScreen 
        visible={browseVisible} 
        onClose={() => setBrowseVisible(false)}
        userCards={userCards}
        onAddCard={handleAddCard}
      />
    </>
  );
}

function Navigation() {
  const { user, loading } = useAuth();

  // Configure deep linking
  const linking = {
    prefixes: ['exp://', 'loyaltyapp://'],
    config: {
      screens: {
        Home: 'home',
        Browse: 'browse',
        Profile: 'profile',
        scan: {
          path: 'scan',
          parse: {
            program: (program) => program,
            points: (points) => points,
            time: (time) => time,
            sig: (sig) => sig,
            merchant: (merchant) => merchant,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Satoshi-Variable': require('./assets/fonts/TTF/Satoshi-Variable.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if font fails to load
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
