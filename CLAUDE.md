# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npx expo start

# Platform-specific dev
npx expo start --android
npx expo start --ios
npx expo start --web

# Lint
npx expo lint
```

No test suite is configured. There is no build command — EAS handles production builds via `eas build`.

## Architecture

**MobileLifestyle** is an Expo/React Native health tracking app with an AI chatbot, targeting iOS, Android, and Web.

### Routing

File-based routing via **Expo Router v6**. Route groups:
- `app/(auth)/` — unauthenticated screens (login, signup)
- `app/(tabs)/` — main tabbed interface: home (`index`), stats (`stat`), AI bot (`bot`), profile (`profile`)
- `app/(disease)/` — disease data entry screens (modal-style)

`app/_layout.tsx` holds the root layout with `AuthProvider` and a `RouteGuard` that redirects based on auth state.

### State Management

No Redux/Zustand — uses **React Context** for auth and **custom hooks** for features:
- `src/contexts/auth-context.tsx` — `AuthContext` with `user`, `signIn`, `signUp`, `signOut`
- `src/hooks/useChat.ts` — chat messages, speech synthesis, feedback
- `src/hooks/useHealth.ts` — health records CRUD

### Backend

**Appwrite** (BaaS) handles auth and database:
- `src/services/appwrite.ts` — Appwrite client init and exported service instances
- Auth uses Appwrite Account service with email/password sessions (no JWT management needed)
- Collections: `health_records`, `user_profiles`, `health_alerts`, `habits`, `completions`, `chat_sessions`
- All Appwrite IDs come from `EXPO_PUBLIC_*` env vars in `.env.local`

**AI Chat API** is a separate HTTP service (currently tunneled via ngrok):
- `src/config/api.ts` — base URL, endpoints: `/chat`, `/transcribe`, `/history/{sessionId}`
- The ngrok URL in `api.ts` is a dev endpoint and changes when the tunnel restarts

### Key Source Locations

| Path | Purpose |
|------|---------|
| `src/config/api.ts` | AI API base URL and endpoints |
| `src/constants/` | Disease definitions, health stat configs, warning thresholds |
| `src/types/` | Shared TypeScript interfaces |
| `src/utils/` | Formatting and validation helpers |

### Environment Variables

Copy `.env.local` (not committed) with these keys:
```
EXPO_PUBLIC_APPWRITE_ENDPOINT
EXPO_PUBLIC_APPWRITE_PROJECT_ID
EXPO_PUBLIC_DB_ID
EXPO_PUBLIC_HEALTH_RECORD_COLLECTION_ID
EXPO_PUBLIC_HEALTH_ALERTS_COLLECTION_ID
EXPO_PUBLIC_USER_PROFILES_COLLECTION_ID
EXPO_PUBLIC_HABITS_COLLECTION_ID
EXPO_PUBLIC_COMPLETION_COLLECTION_ID
EXPO_PUBLIC_CHAT_SESSIONS_COLLECTION_ID
```

### Path Alias

`@/*` maps to the repo root. Use `@/src/...`, `@/app/...` etc. for imports.

### Notable Config

- New Architecture enabled (`app.json`)
- React Compiler enabled (experimental)
- Typed routes enabled (Expo Router)
- UI language is Vietnamese
- UI components use **React Native Paper** (Material Design)
