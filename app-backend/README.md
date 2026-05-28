# App Backend

Express TypeScript backend đứng giữa Mobile App và các dịch vụ bên ngoài.

Backend chịu trách nhiệm verify Supabase JWT, chuẩn hóa response/error, xử lý Profile API và proxy các request AI sang AI Service. Backend không chạy logic phân tích y tế và không thay Mobile quản lý session.

## Tech Stack

- Node.js
- Express
- TypeScript
- Supabase Auth/JWT
- AI Service proxy

## Cài Đặt

Yêu cầu:

- Node.js
- npm

Cài dependencies:

```bash
cd app-backend
npm install
```

Tạo file `app-backend/.env`:

```env
PORT=8000
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

AI_SERVICE_BASE_URL=http://localhost:8001/api/v1
AI_SERVICE_API_KEY=development-ai-service-key
AI_SERVICE_TIMEOUT_MS=30000
```

Trong môi trường dev, backend có thể đọc Supabase env từ `mobile/.env.local`, nhưng khi deploy nên cấu hình env riêng cho backend.

## Chạy Backend

Chạy từ thư mục `app-backend/`:

```bash
npm run dev
```

Hoặc chạy từ root project:

```bash
npm run backend
```

Build và chạy production build:

```bash
npm run build
npm run start
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```
