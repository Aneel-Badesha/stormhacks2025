<img width="2400" height="1350" alt="image" src="https://github.com/user-attachments/assets/2a27adbb-606c-400c-b697-7d2933b522a9" />


# Punchly: Punch in, Get rewarded. 

**Digital punch-card loyalty rewards platform for small businesses** | Built for StormHacks 2025 

Replace physical punch cards with NFC-powered digital loyalty. Customers tap to earn rewards, merchants track engagement in real-time.

## Table of Contents

- [Executive Summary](#executive-summary)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Technology Stack](#technology-stack)
- [Features](#features)

## Executive Summary

Small merchants still rely on physical loyalty artifacts (punch cards, stamp cards, plastic rewards cards). Those artifacts are fragile, untrackable, and give merchants no analytics — while large brands run digital programs that measurably increase revenue.

**Punchly** is a unified digital loyalty platform that replaces all traditional punch/stamp/rewards cards with a single mobile + web product: customers tap an NFC tag to collect stamps or points, merchants manage programs in a simple admin panel, and both sides benefit from better tracking, anti-fraud, and measurable ROI.

---

## The Problem

Physical loyalty systems are failing small businesses:

- Paper/punch cards and plastic rewards cards are easy to lose, easy to game, and provide zero analytics
- Small merchants can't afford or don't have the expertise for complex loyalty SaaS used by big retailers
- Fragmented customer experiences (many physical cards, many programs) reduce engagement and adoption
- Merchants lack simple, affordable tools to measure program ROI or re-engage customers efficiently

---

## Our Solution

Replace the entire physical loyalty stack with one digital platform:

- Multiple reward formats - Stamp/punch cards, points systems, single-reward programs
- NFC tap - Native mobile scanning with QR fallback for universal coverage
- No-code admin panel - Campaign creation, analytics, and customer re-engagement
- Low-cost & secure - Privacy-conscious, fraud-resistant architecture


### Components

1. **[Mobile App](./mobile/)** - React Native app for customers to scan NFC tags and manage loyalty cards
2. **[Flask Server](./server/)** - Python backend API for authentication, rewards tracking, and analytics
3. **Admin Dashboard** - Web-based portal for businesses to manage programs and view analytics

---

## Technology Stack

### Mobile App
- **Framework:** React Native (Expo)
- **Navigation:** React Navigation
- **UI Library:** React Native Paper
- **Auth:** Supabase

### Backend Server
- **Framework:** Flask 3.0.0
- **Database:** SQLite3
- **Auth:** bcrypt
- **CORS:** flask-cors

---

## Features

### For Customers (Mobile App)

- Tap to Earn - Scan NFC tags at businesses to collect rewards
- Digital Wallet - All loyalty cards in one app
- Progress Tracking - Visual progress bars for each program
- Reward Notifications - Instant feedback on earnings
- Secure Login - Email/password authentication

### For Businesses (Admin Dashboard)

- Program Management - Create and customize loyalty programs
- Real-Time Analytics - Track customer engagement and scans
- Customer Insights - View all customers and their progress
- Manual Scanning - Award points for in-store purchases
- Reward Redemption - Simple one-click reward validation

### Technical Features

- NFC Deep Linking - Tap-to-open app functionality
- Real-Time Sync - Instant updates across all platforms
- Secure Sessions - bcrypt password hashing, token-based auth
- Offline Support - Local storage with auto-sync
- RESTful API - Clean, documented endpoints
