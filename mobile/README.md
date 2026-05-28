# Mobile App

Expo React Native app cho hệ thống theo dõi sức khỏe cá nhân.

Mobile chịu trách nhiệm hiển thị UI, điều hướng, quản lý session Supabase Auth phía client và gọi App Backend thông qua API client. Mobile không gọi trực tiếp Supabase Database hoặc AI Service.

## Tech Stack

- Expo / React Native
- Expo Router
- TypeScript
- Supabase Auth
- React Native Paper

## Cài Đặt

Yêu cầu:

- Node.js
- npm
- Expo Go hoặc emulator/simulator

Cài dependencies:

```bash
cd mobile
npm install
```

Tạo file `mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Nếu chạy app trên điện thoại thật, `EXPO_PUBLIC_API_BASE_URL` cần trỏ tới địa chỉ backend mà điện thoại truy cập được, ví dụ IP LAN hoặc ngrok URL.

## Chạy App

Chạy từ thư mục `mobile/`:

```bash
npm run start
```

Hoặc chạy từ root project:

```bash
npm run mobile
```

Các lệnh hữu ích:

```bash
npm run android
npm run ios
npm run web
npm run lint
npx tsc --noEmit
```
