import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';

import { AuthProvider, useAuth } from './contexts/FlaskAuthContext';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import BrowseScreen from './screens/BrowseScreen';
import { COLORS, FONTS } from './constants/theme';
import { INITIAL_USER_CARDS } from './data/mockData';
import { parseStaticTag, validateUserHasCard, awardPunches } from './utils/staticNfcEncoder';
import { ALL_PROGRAMS } from './data/mockData';

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
  const [browseVisible, setBrowseVisible] = useState(false);
  const [userCards, setUserCards] = useState(INITIAL_USER_CARDS);
  const insets = useSafeAreaInsets();
  
  // Use ref to always have latest userCards in handleDeepLink
  const userCardsRef = React.useRef(userCards);
  React.useEffect(() => {
    userCardsRef.current = userCards;
  }, [userCards]);

  const handleDeepLink = React.useCallback(({ url }) => {
    console.log('Deep link received:', url);
    
    const result = parseStaticTag(url);
    
    if (result.error) {
      // Don't show alert for silent errors (like base URL without params)
      if (!result.silent) {
        Alert.alert('Scan Error', result.error);
      }
      return;
    }
    
    // Find the program
    const program = ALL_PROGRAMS.find(p => p.id === result.programId);
    if (!program) {
      Alert.alert('Error', 'Program not found');
      return;
    }
    
    // Check if user has the card (use ref for latest value)
    if (!validateUserHasCard(result.programId, userCardsRef.current)) {
      Alert.alert(
        'Card Not Found',
        `You don't have a ${program.name} card yet. Would you like to add it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Card', 
            onPress: () => {
              handleAddCard(program);
              Alert.alert('Success', 'Card added! Please scan again to earn points.');
            }
          },
        ]
      );
      return;
    }
    
    // Check if card is already at max punches
    const currentCard = userCardsRef.current.find(card => card.id === result.programId);
    const currentPunches = currentCard?.punches || 0;
    const maxPunches = currentCard?.maxPunches || 10;
    const isAtMax = currentPunches >= maxPunches;
    
    console.log(`Card check: ${currentPunches}/${maxPunches} punches, isAtMax: ${isAtMax}`);
    
    if (isAtMax) {
      // Card is full - don't award punch, show redeem message
      console.log('⚠️ Card at max punches - must redeem first');
      
      // Use setTimeout to ensure alert shows (in case previous alert is still showing)
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
    
    // Award punches (use ref for latest value)
    const updatedCards = userCardsRef.current.map(card => {
      if (card.id === result.programId) {
        return awardPunches(card, result.points);
      }
      return card;
    });
    
    setUserCards(updatedCards);
    
    // Show alert
    const punchText = result.points === 1 ? 'punch' : 'punches';
    console.log('✅ SUCCESS: Punch awarded!');
    console.log(`+${result.points} ${punchText} added to ${program.name}`);
    
    // Use setTimeout to ensure alert shows after state update
    setTimeout(() => {
      Alert.alert(
        '🎉 Punch Added!',
        `+${result.points} ${punchText} added to ${program.name}\n\nCheck your Home screen to see the update!`,
        [{ text: 'Awesome!', style: 'default' }],
        { cancelable: true }
      );
    }, 100);
  }, []); // Empty deps - use ref for latest userCards

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
      // Only process if it has query parameters and hasn't been processed yet
      if (url && url.includes('?') && !hasProcessedInitialUrl) {
        hasProcessedInitialUrl = true;
        handleDeepLink({ url });
      }
    });
    
    return () => {
      console.log('Removing deep link listener');
      subscription.remove();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleAddCard = (program) => {
    // Check if card already exists
    if (userCardsRef.current.some(card => card.id === program.id)) {
      return;
    }
    
    // Estimate cash value based on program type
    const getCashPerRedeem = (programName) => {
      const estimates = {
        'Starbucks Rewards': 5,
        'Tim Hortons': 4,
        'Shoppers Optimum': 20,
        'Aeroplan': 50,
        'Best Buy Rewards': 25,
        'Sephora Beauty Insider': 15,
      };
      return estimates[programName] || 10;
    };
    
    // Create new card with default values
    const newCard = {
      id: program.id,
      name: program.name,
      punches: 0,
      maxPunches: program.maxPunches || 10,
      color: program.color,
      visits: 0,
      rewards: 0,
      saved: '$0',
      cash_per_redeem: getCashPerRedeem(program.name),
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      cardId: `****${Math.floor(1000 + Math.random() * 9000)}`,
      companyDescription: program.companyDescription,
      programDescription: program.programDescription,
    };
    
    setUserCards([...userCardsRef.current, newCard]);
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
          {(props) => <HomeScreen {...props} userCards={userCards} setUserCards={setUserCards} />}
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
