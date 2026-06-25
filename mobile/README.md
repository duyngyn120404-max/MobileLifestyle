# Mobile Frontend

Đây là ứng dụng Expo React Native của hệ thống theo dõi sức khỏe cá nhân. Mobile frontend là lớp người dùng tương tác trực tiếp: hiển thị màn hình, nhận dữ liệu nhập, quản lý trạng thái giao diện, validate cơ bản và gọi App Backend API.

Vị trí của mobile trong hệ thống:

```text
User
 ↓
Mobile Frontend
 ↓
App Backend
 ↓
AI Backend / Database
```

Mobile không chứa business logic chính, không gọi AI Backend trực tiếp và không truy cập Supabase Database trực tiếp. Supabase ở mobile chỉ dùng cho Auth/session.

## Cấu Trúc

```text
mobile/
  app/          Màn hình và điều hướng bằng Expo Router
  src/api/      API client gọi App Backend
  src/features/ Hooks, types, validation và component theo từng chức năng
  src/config/   Biến môi trường, Supabase Auth và API routes
  src/utils/    Helper dùng chung như formatting và logger
  assets/       Ảnh, animation và tài nguyên giao diện
  README.md     Hướng dẫn chạy và kiểm tra mobile frontend
```

Các thư mục chính nên được hiểu như sau:

- `app/` là nơi định nghĩa màn hình người dùng nhìn thấy.
- `src/api/` là cầu nối từ mobile sang App Backend.
- `src/features/` chứa logic frontend theo domain như auth, profile, chatbot, health và reports.
- `src/config/` chứa cấu hình ứng dụng cần để kết nối hệ thống.
- `src/utils/` chứa hàm phụ trợ dùng lại ở nhiều nơi.

## Tech Stack

- Expo / React Native
- Expo Router
- TypeScript
- Supabase Auth
- React Native Paper

## Cài Đặt

Yêu cầu:

- Node.js 20
- npm
- Expo Go hoặc emulator/simulator

Cài dependencies:

```bash
cd mobile
npm install
```

Tạo file `mobile/.env.local` dựa trên `mobile/.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_BACKEND_URL=http://localhost:8000/api/v1
```

Nếu chạy app trên điện thoại thật, `EXPO_PUBLIC_APP_BACKEND_URL` cần trỏ tới địa chỉ App Backend mà điện thoại truy cập được, ví dụ IP LAN hoặc ngrok URL.

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

## Kiểm Tra Trước Khi Demo

Lint kiểm tra import không dùng, biến không dùng và một số rule code style:

```bash
npm --prefix mobile run lint
```

Typecheck kiểm tra TypeScript có khớp type, props và API contract không:

```bash
npx --prefix mobile tsc --noEmit
```

Smoke test là checklist chạy thử nhanh các luồng chính:

- Mở app được.
- Login/logout được.
- Vào Home được.
- Vào Chatbot và gửi một tin nhắn được.
- Vào Health Tracking, xem/tạo/sửa/xóa dữ liệu được.
- Vào Reports, load hoặc generate report được.
- Vào Profile, xem/sửa thông tin được.
