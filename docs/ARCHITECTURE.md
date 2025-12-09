# Project Architecture

## Overview

MobileLifestyle là một React Native + Expo application để theo dõi sức khỏe với AI chatbot. Project sử dụng Expo Router cho navigation và Appwrite cho backend.

## Directory Structure

```
MobileLifestyle/
├── app/                      # Expo Router screens (File-based routing)
│   ├── _layout.tsx          # Root layout + RouteGuard
│   ├── (auth)/              # Authentication routes
│   │   ├── _layout.tsx
│   │   └── index.tsx        # Login/Register screen
│   ├── (disease)/           # Disease input routes
│   │   ├── _layout.tsx
│   │   └── input.tsx        # Disease data input form
│   └── (tabs)/              # Main app routes (Bottom tabs)
│       ├── _layout.tsx      # Tab navigator
│       ├── index.tsx        # Home/Dashboard
│       ├── bot.tsx          # AI ChatBot
│       ├── stat.tsx         # Statistics & Charts
│       └── profile.tsx      # User Profile
│
├── src/                      # Source code
│   ├── api/                 # API call functions (future)
│   ├── config/
│   │   └── api.ts           # API endpoints configuration
│   ├── constants/
│   │   └── diseases.ts      # Disease data, warnings, stats
│   ├── contexts/
│   │   └── auth-context.tsx # Auth state management (React Context)
│   ├── hooks/               # Custom React hooks
│   │   ├── useHealth.ts     # Health data operations
│   │   ├── useChat.ts       # Chat operations
│   │   └── index.ts         # Barrel export
│   ├── services/
│   │   └── appwrite.ts      # Appwrite client initialization
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── utils/               # Utility functions
│       ├── formatting.ts    # Text formatting functions
│       ├── validation.ts    # Input validation functions
│       └── index.ts         # Barrel export
│
├── assets/
│   └── images/              # Images, icons, backgrounds
│
├── docs/                     # Project documentation
│   ├── ARCHITECTURE.md       # This file
│   ├── API.md               # API documentation
│   ├── SETUP.md             # Setup instructions
│   └── DATABASE.md          # Database schema
│
├── .env.local               # Environment variables
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint rules
├── package.json             # Dependencies
└── DATABASE_SCHEMA.md       # Database schema (legacy, see docs/)
```

## Layer Architecture

### 1. **Presentation Layer** (`app/`)
- Screens and UI components
- Navigation routing
- User interactions

### 2. **Business Logic Layer** (`src/`)
- Custom hooks (`hooks/`)
- State management (`contexts/`)
- API integration logic

### 3. **Data Layer** (`src/services/`)
- Database client (Appwrite)
- API calls

### 4. **Utility Layer** (`src/utils/`)
- Formatting functions
- Validation functions

## Key Patterns

### State Management
```typescript
// Global state: AuthContext
const { user, isLoadingUser, signUp, signIn, signOut } = useAuth();

// Local state: useState
const [messages, setMessages] = useState<Message[]>([]);

// Custom hooks: useHealth, useChat
const { records, fetchRecords } = useHealth();
```

### API Integration
```typescript
// Config
import { API_ENDPOINTS } from "@/src/config/api";

// Usage
const response = await fetch(API_ENDPOINTS.CHAT, { ... });
```

### Type Safety
```typescript
// Define interfaces
interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

// Use in components
const messages: Message[] = [...];
```

## Data Flow Examples

### User Authentication
```
Login Screen → AuthContext.signIn() → Appwrite Account.createEmailPasswordSession()
→ Store user in context → Navigate to (tabs)
```

### Send Chat Message
```
User input → handleSendMessage() → POST /chat API → Stream response
→ Update messages state → Display in FlatList
```

### Health Record
```
Disease input → Add record → Appwrite Database → Query in Stats
→ Calculate statistics → Render charts
```

## Technology Stack

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router (File-based)
- **State Management**: React Context + useState
- **Backend**: Appwrite (Backend-as-Service)
- **Database**: Appwrite Collections
- **Language**: TypeScript
- **Styling**: React Native StyleSheet
- **Charts**: react-native-chart-kit
- **Voice**: expo-speech, expo-av (Audio recording)
- **Images**: expo-image-picker
- **HTTP**: Fetch API

## Best Practices

### 1. Separation of Concerns
- UI logic in components
- Business logic in hooks/contexts
- Data access in services

### 2. Type Safety
- Always define interfaces for data
- Use TypeScript for type checking
- Avoid `any` type

### 3. Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging

### 4. Performance
- Use FlatList for lists
- Memoize callbacks with useCallback
- Optimize re-renders with proper dependencies

### 5. Code Organization
- Group related code together
- Use barrel exports (index.ts)
- Keep functions small and focused

## Import Patterns

```typescript
// Hooks
import { useAuth } from "@/src/contexts/auth-context";
import { useHealth, useChat } from "@/src/hooks";

// Services
import { databases, account } from "@/src/services/appwrite";

// Types
import type { Message, Disease } from "@/src/types";

// Config
import { API_ENDPOINTS } from "@/src/config/api";

// Utils
import { formatDateVN, isValidEmail } from "@/src/utils";

// Constants
import { DISEASE_LIST } from "@/src/constants/diseases";
```

## Future Improvements

- [ ] Extract reusable UI components to `src/components/`
- [ ] Add unit tests in `__tests__/`
- [ ] Create API layer in `src/api/`
- [ ] Add CI/CD workflows
- [ ] Implement error boundary
- [ ] Add analytics
- [ ] Implement offline support
