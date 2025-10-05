# Frontend-Backend Connection Setup

## Summary of Changes

I've successfully connected your React Native mobile app with your Python Flask backend. Here's what was implemented:

### 1. **API Service Layer** (`mobile/lib/api.js`)
- Created a comprehensive API service that handles all communication with the Flask backend
- Configured for both development (localhost:5000) and production environments
- Includes proper error handling and session management

### 2. **Flask Backend Updates** (`server/server.py`)
- Updated CORS configuration to allow mobile app requests
- Added mobile authentication endpoints:
  - `POST /api/mobile/auth/login` - User login
  - `POST /api/mobile/auth/logout` - User logout  
  - `GET /api/mobile/auth/session` - Check session status
  - `GET /api/mobile/user/cards` - Get user's loyalty cards

### 3. **New Authentication Context** (`mobile/contexts/FlaskAuthContext.js`)
- Created a Flask-based authentication context to replace Supabase
- Handles user sessions, login, logout, and registration
- Maintains user state across the app

### 4. **Environment Configuration** (`mobile/.env`)
- Added Flask API configuration
- Easy switching between development and production URLs

### 5. **App Configuration Updates**
- Updated `App.js` to use the new Flask authentication
- Updated `package.json` scripts for easier development

## How to Use

### Starting the Application

1. **Start the Flask Backend:**
   ```bash
   cd server
   python server.py
   ```
   The server will run on `http://localhost:5000`

2. **Start the Mobile App:**
   ```bash
   cd mobile
   npm start
   ```

3. **Or start both together:**
   ```bash
   npm run dev
   ```

### Testing the Connection

1. Use the API test screen I created (`screens/ApiTestScreen.js`) to test the connection
2. Test with existing users from your database (like `alice@example.com`)

### Available API Endpoints

- **Authentication:**
  - `POST /api/mobile/auth/register` - Register new user
  - `POST /api/mobile/auth/login` - Login user
  - `POST /api/mobile/auth/logout` - Logout user
  - `GET /api/mobile/auth/session` - Get current session

- **User Data:**
  - `GET /api/mobile/user/cards` - Get user's loyalty cards
  - `GET /api/mobile/companies` - Get all companies/programs
  - `POST /api/mobile/scan` - Process NFC scan

### Environment Variables

The mobile app uses these environment variables (in `.env`):
- `EXPO_PUBLIC_API_BASE_URL` - Flask backend URL (default: http://localhost:5000)
- `EXPO_PUBLIC_ENABLE_DEBUG` - Enable debug logging

## Next Steps

1. **Test the connection** by running both backend and frontend
2. **Update login/signup screens** to use the new FlaskAuthContext
3. **Replace mock data** in existing screens with real API calls
4. **Add error handling** and loading states in the UI
5. **Configure production** URLs when deploying

## Important Notes

- The Flask server includes session-based authentication using cookies
- CORS is configured to allow requests from the mobile app
- The API service automatically handles JSON parsing and error responses
- All API calls include credentials for session management

## Troubleshooting

If you encounter issues:
1. Ensure the Flask server is running on port 5000
2. Check the mobile app's network requests in the development tools
3. Verify the API base URL in the environment configuration
4. Check CORS settings if getting cross-origin errors