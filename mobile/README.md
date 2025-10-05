# Tapply Mobile - NFC Loyalty Card App

React Native mobile application for Tapply loyalty rewards platform. Customers can tap NFC tags at businesses to earn rewards, view their digital loyalty cards, and track progress toward free items.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Deep Linking](#deep-linking)
- [Authentication](#authentication)
- [Development](#development)

## Features

### Core Functionality
- **NFC Scanning** - Tap NFC tags at businesses to earn rewards
- **Digital Wallet** - View all loyalty cards in one place
- **Progress Tracking** - Real-time visual progress bars for each card
- **Reward Notifications** - Instant feedback when earning rewards
- **Program Discovery** - Browse and join new loyalty programs
- **User Profile** - Manage account settings and view statistics

### User Experience
- **Secure Authentication** - Email/password login with Supabase
- **Modern UI** - Clean interface with React Native Paper components
- **Instant Feedback** - Real-time animations and success messages
- **Smart Notifications** - Context-aware alerts for scans and rewards
- **Cross-Platform** - Works on iOS and Android

### Technical Features
- **Deep Linking** - Tap NFC tags to open app directly
- **Offline Support** - Local state management with AsyncStorage
- **Auto-Sync** - Automatic syncing with backend server
- **Smart Routing** - URL scheme handling for NFC redirects

## Tech Stack

- **Framework:** React Native (Expo ~54.0.12)
- **Navigation:** React Navigation 7.x (Stack + Bottom Tabs)
- **UI Library:** React Native Paper 5.14.5
- **Authentication:** Supabase Auth 2.58.0
- **Storage:** AsyncStorage 2.2.0
- **Deep Linking:** Expo Linking 7.0.3
- **Icons:** React Native Vector Icons 10.3.0
- **State Management:** React Context API

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Expo CLI** (installed globally)
- **iOS Simulator** (Mac only) or **Android Emulator**
- **Physical device** (for NFC testing)
- **Supabase account** (for authentication)

## Installation

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Expo CLI globally** (if not already installed)
   ```bash
   npm install -g expo-cli
   ```

## Configuration

### Environment Variables

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Configure Supabase credentials in `.env`**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   Get these values from your [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

### App Configuration

The app is configured in `app.json`:
- **Bundle Identifier (iOS):** `com.stormhacks.loyaltyapp`
- **Package Name (Android):** `com.stormhacks.loyaltyapp`
- **Deep Link Scheme:** `loyaltyapp://`

## Running the App
### Start Development Server

```bash
npm start
```

This opens Expo Dev Tools at `http://localhost:19002`



## Project Structure

```
mobile/
├── App.js                      # Main app entry point
├── screens/                    # Screen components
│   ├── LoginScreen.js          # Authentication - Login
│   ├── SignUpScreen.js         # Authentication - Sign Up
│   ├── HomeScreen.js           # Main screen - Loyalty cards
│   ├── ProfileScreen.js        # User profile
│   └── BrowseScreen.js         # Browse programs
├── components/                 # Reusable UI components
├── contexts/                   # React Context providers
├── lib/                        # External integrations
│   └── supabase.js             # Supabase client
├── utils/                      # Helper functions
├── constants/                  # App constants
│   └── theme.js                # Colors, fonts, spacing
└── data/                       # Mock/seed data - unused
```

## Deep Linking

### URL Scheme

The app uses the custom scheme `loyaltyapp://` for NFC tag scanning.

### NFC Tag Format

NFC tags encode scan URLs in this format:
```
loyaltyapp://scan?programId=1&userId=123&timestamp=1234567890
```

### Testing Deep Links

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "loyaltyapp://scan?programId=1&userId=123&timestamp=$(date +%s)"
```

**iOS:**
```bash
xcrun simctl openurl booted "loyaltyapp://scan?programId=1&userId=123&timestamp=$(date +%s)"
```

## Authentication

### Supabase Integration
The app uses Supabase for user authentication:

1. **Sign Up Flow:**
   - User enters email, password, and full name
   - Account created in Supabase Auth
   - User synced to backend database

2. **Login Flow:**
   - User enters email and password
   - Authenticated via Supabase
   - Session token stored in AsyncStorage

## Development

### Hot Reload
Expo provides automatic hot reload. Changes to code will instantly reflect in the app.

### Debugging
**Open developer menu:**
- iOS: Cmd+D
- Android: Cmd+M (Mac) or Ctrl+M (Windows/Linux)

**View logs:**
```bash
npx expo start
# Press 'j' to open debugger
```