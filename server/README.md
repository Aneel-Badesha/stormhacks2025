# Punchly Server - Loyalty Rewards API

Flask-based backend server for the Tapply loyalty rewards platform. Provides REST APIs for company admin dashboards and mobile app NFC-based reward tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Development](#development)

## Features

### Admin Dashboard
- 🔐 **Company Authentication** - Email/password login with bcrypt hashing
- 📊 **Analytics Dashboard** - Total users, scans, and rewards tracking
- 👥 **Customer Management** - View all customers with reward progress
- ⚡ **Manual Scanning** - Increment rewards for customers in-store
- 🎁 **Reward Redemption** - Reset customer progress after reward claimed

### Mobile App APIs
- 📱 **User Authentication** - Register, login, and session management
- 🏪 **Company Discovery** - Browse active loyalty programs
- 💳 **Digital Wallet** - View all loyalty cards in one place
- 📍 **NFC Scanning** - Tap-to-earn rewards at participating businesses
- 📈 **Progress Tracking** - Real-time reward progress and milestones

### Core Features
- 🔄 **CORS Support** - Cross-origin requests for web and mobile clients
- 🗃️ **SQLite Database** - Lightweight, file-based storage
- 🔒 **Session Management** - Secure cookie-based authentication
- 🚀 **RESTful API** - Clean, predictable endpoint structure

## Tech Stack

- **Framework:** Flask 3.0.0
- **Database:** SQLite3
- **Authentication:** bcrypt (password hashing)
- **CORS:** flask-cors 4.0.0
- **Language:** Python 3

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- SQLite3 (included with Python)
- Make (optional, for using Makefile commands)

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd /Users/anton/dev/storm/stormhacks2025/server
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation**
   ```bash
   python3 -c "import flask, flask_cors, bcrypt; print('✅ All dependencies installed')"
   ```

## Quick Start

### Using Make (Recommended)

```bash
make run
```

This command will:
1. Delete the old database (`data/rewards.db`)
2. Create fresh schema from `data/schema.sql`
3. Insert seed data from `data/seed.sql`
4. Start the Flask server on `http://127.0.0.1:5000`

### Manual Setup

```bash
# Clean up old database
rm -f data/rewards.db

# Initialize database schema
python3 -c "from server import init_db; init_db()"

# Seed with test data
sqlite3 data/rewards.db < data/seed.sql

# Start server
python3 server.py
```

### Access the Dashboard

1. Open **http://127.0.0.1:5000** in your browser
2. Login with test credentials:
   - **Email:** `p`
   - **Password:** `password`

## Configuration

### Session Settings
The server uses secure session cookies with the following configuration:
- **Session Lifetime:** 7 days
- **Cookie SameSite:** Lax
- **Secure Flag:** `False` (set to `True` for HTTPS in production)

### CORS Origins
Configured to accept requests from:
- `http://localhost:5000` - Admin dashboard
- `http://localhost:8081` - Expo mobile app
- `http://localhost:19000` - Expo dev server
- All origins (`*`) for development (⚠️ **remove in production**)

### Database Path
- Default: `data/rewards.db`
- Modify `DB_PATH` in `server.py` to change location

## Database Schema
See `data/schema.sql`

### Seed Data

The `data/seed.sql` file includes:
- **5 demo companies** (Tim Hortons, Pizza Palace, Book Haven, Gym Fitness, Bakery Bliss)
- **11 demo customers** with various reward progress levels
- **All test accounts use password:** `password`

## API Endpoints

### Authentication (Admin)

#### `POST /api/auth/login`
Login as a company admin.

**Request Body:**
```json
{
  "email": "p",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "Tim Hortons",
    "description": "Tim Hortons Tims Rewards loyalty program"
  }
}
```

#### `POST /api/auth/logout`
Logout current admin session.

#### `GET /api/auth/session`
Check current admin session status.

### Mobile Authentication

#### `POST /api/mobile/auth/login`
Login as a customer (mobile app).

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "password"
}
```

#### `POST /api/mobile/auth/sync-user`
Sync user from Supabase auth (for Supabase integration).

#### `GET /api/mobile/auth/session`
Get current mobile user session.

#### `POST /api/mobile/auth/logout`
Logout mobile user.

### Admin Dashboard APIs

#### `GET /api/stats`
Get dashboard statistics for logged-in company.

**Response:**
```json
{
  "total_users": 4,
  "total_scans": 20,
  "close_to_reward": 2
}
```

#### `GET /api/users`
Get all customers with rewards at current company.

**Response:**
```json
[
  {
    "id": 1,
    "email": "alice@example.com",
    "full_name": "Alice Anderson",
    "score": 2,
    "target_score": 5,
    "last_scan_at": "2025-10-01T10:30:00"
  }
]
```

#### `POST /api/rewards/scan`
Manually increment customer reward (admin scan).

**Request Body:**
```json
{
  "user_id": 1
}
```

#### `POST /api/rewards/increment`
Increment reward by custom amount.

**Request Body:**
```json
{
  "user_id": 1,
  "amount": 2
}
```

#### `POST /api/rewards/reset`
Reset customer progress after reward redemption.

**Request Body:**
```json
{
  "user_id": 1
}
```

### Mobile App APIs

#### `GET /api/mobile/user/cards`
Get all loyalty cards for logged-in user.

#### `GET /api/mobile/companies`
Get all active companies/programs.

#### `GET /api/mobile/programs`
Alias for `/api/mobile/companies`.

#### `POST /api/mobile/scan`
Primary NFC scan endpoint for mobile app.

**Request Body:**
```json
{
  "user_id": 1,
  "company_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "user_id": 1,
  "company_id": 1,
  "company_name": "Tim Hortons",
  "previous_score": 4,
  "new_score": 5,
  "target_score": 5,
  "reward_earned": true,
  "progress_percentage": 100,
  "scans_until_reward": 0,
  "reward_message": "🎉 Congratulations! You earned a reward at Tim Hortons!"
}
```

#### `GET /api/mobile/rewards/<user_id>`
Get all rewards for a specific user.

## Authentication

### Admin Authentication
- **Method:** Session cookies
- **Password Hashing:** bcrypt with salt
- **Session Lifetime:** 7 days (permanent sessions)
- **Protection:** All admin endpoints require active session

### Mobile Authentication
- **Method:** Session cookies + optional Supabase integration
- **Password Hashing:** bcrypt with salt
- **Session Management:** Persistent sessions with automatic expiry
- **Protection:** User-specific endpoints require authentication

## Project Structure

```
server/
├── server.py              # Main Flask application
├── requirements.txt       # Python dependencies
├── Makefile              # Build automation
├── README.md             # This file
├── data/
│   ├── schema.sql        # Database schema
│   ├── seed.sql          # Test data
│   └── rewards.db        # SQLite database (generated)
├── templates/
│   ├── index.html        # Login page
│   └── dashboard.html    # Admin dashboard
├── static/
│   └── css/
│       ├── login.css     # Login page styles
│       └── dashboard.css # Dashboard styles
└── tests/                # Test directory (TBD)
```

## Development

### Start Development Server

python3 server.py

### Database Management

**View database contents:**
```bash
sqlite3 data/rewards.db
```

**Reset database:**
```bash
make clean init seed
```