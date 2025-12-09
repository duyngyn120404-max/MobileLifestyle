# Setup Instructions

## Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Appwrite Account**: https://appwrite.io (self-hosted or cloud)
- **ngrok Account**: https://ngrok.com (for local backend tunneling)
- **Backend Server**: Running on port 8386

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/ntdbouque/MobileLifestyle.git
cd MobileLifestyle
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables

Create `.env.local` file in project root:

```bash
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_PROJECT_NAME="New project"

# Database Configuration
EXPO_PUBLIC_DB_ID=your_database_id
EXPO_PUBLIC_USER_PROFILES_COLLECTION_ID=user_profiles
EXPO_PUBLIC_HEALTH_RECORD_COLLECTION_ID=health_record
EXPO_PUBLIC_HEALTH_ALERTS_COLLECTION_ID=health_alerts
EXPO_PUBLIC_CHAT_SESSIONS_COLLECTION_ID=chat_sessions
```

### 4. Setup Appwrite

#### Option A: Cloud (Recommended for Development)
1. Go to https://appwrite.io/console
2. Create a new project
3. Note your Project ID
4. Create a database with ID: `health_db`
5. Create collections as per `docs/DATABASE.md`
6. Copy Project ID to `.env.local`

#### Option B: Self-Hosted
```bash
docker-compose up -d
# Access at http://localhost/console
```

### 5. Setup Backend API

Your backend should be running and accessible:

```bash
# Option A: Local
backend/
├── server.py      # Flask/FastAPI
├── requirements.txt
└── run.sh

# Start backend
python server.py
# Runs on localhost:8386

# Option B: With ngrok (to expose to mobile)
ngrok http 8386
# Get public URL: https://xxxx-xxxx-xxxx.ngrok-free.dev
```

### 6. Update API Endpoints

In `src/config/api.ts`:

```typescript
const API_BASE_URL = "https://your-ngrok-url.ngrok-free.dev"; // Your ngrok URL

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,
  TRANSCRIBE: `${API_BASE_URL}/transcribe`,
  HISTORY: (sessionId: string) => `${API_BASE_URL}/history/${sessionId}`,
};
```

## Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Options:
# - Press 'i' for iOS Simulator
# - Press 'a' for Android Emulator
# - Press 'w' for Web
# - Press 'j' for Expo Go (scan QR code on phone)
```

### With Tunnel (to access from other devices)

```bash
npx expo start --tunnel
```

### Build for Production

```bash
# Android APK
eas build --platform android --preview

# iOS
eas build --platform ios --preview

# Web
npm run web
```

## Troubleshooting

### Issue: Cannot find module '@/src/services/appwrite'

**Solution:** Make sure path alias is configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: API connection failed (Network request failed)

**Possible causes:**
1. Backend server not running
2. ngrok URL expired or invalid
3. CORS not enabled on backend
4. Wrong API endpoint URL

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:8386/chat

# 2. Restart ngrok and update .env.local
ngrok http 8386

# 3. Add CORS to backend (Flask example)
from flask_cors import CORS
CORS(app)

# 4. Test with correct URL
curl https://your-ngrok-url.ngrok-free.dev/chat
```

### Issue: Appwrite authentication fails

**Solutions:**
1. Verify Project ID in `.env.local`
2. Check Appwrite server is running
3. Verify user exists in Appwrite console

### Issue: Audio recording not working

**iOS:**
```bash
# Add permission in app.json
"infoPlist": {
  "NSMicrophoneUsageDescription": "App needs microphone access to record voice messages"
}
```

**Android:**
```bash
# Add permission in app.json
"permissions": [
  "RECORD_AUDIO"
]
```

## Database Setup

See `docs/DATABASE.md` for detailed collection structure.

Quick setup:
1. Create database: `health_db`
2. Create collections:
   - `health_records`
   - `user_profiles`
   - `health_alerts`
   - `chat_sessions`

## Development Tips

### Hot Reload
Changes to code automatically reload the app in development mode.

### Debugging

**React DevTools:**
```bash
npm install --save-dev @react-native/dev-middleware
```

**Console Logging:**
```typescript
console.log("Debug message");
console.error("Error message");
console.warn("Warning message");
```

**VS Code Debugger:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach Debugger",
      "request": "attach",
      "type": "node",
      "debuggerWorkerThreadExecutor": "inspector"
    }
  ]
}
```

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Deployment

### EAS Build

```bash
# Setup EAS
eas init

# Build
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Web Deployment

```bash
# Build web
npm run web
# Output in .expo folder

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

## Support

- **Issues**: https://github.com/ntdbouque/MobileLifestyle/issues
- **Documentation**: See `docs/` folder
- **API Docs**: `docs/API.md`
- **Database Schema**: `docs/DATABASE.md`
