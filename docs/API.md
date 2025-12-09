# API Documentation

## Base URL
```
https://semisecretly-unmimetic-shelley.ngrok-free.dev
```

## Endpoints

### 1. Chat API
**POST** `/chat`

Send a message to the AI chatbot and receive a streaming response.

**Request:**
```json
{
  "user_id": "string",
  "session_id": "string",
  "message": "string",
  "image": "string (optional, base64)"
}
```

**Response:**
- Streaming text response (Server-Sent Events or chunked)
- Content-Type: text/plain or application/json

**Example:**
```typescript
const response = await fetch(API_ENDPOINTS.CHAT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "user123",
    session_id: "session123",
    message: "What should I eat for diabetes?",
    image: "base64_image_data" // optional
  })
});

// Handle streaming response
const reader = response.body?.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  console.log(chunk); // Process chunk
}
```

---

### 2. Transcribe API
**POST** `/transcribe`

Convert audio to text (Speech-to-Text).

**Request:**
```json
{
  "audio": "string (base64 encoded audio)",
  "format": "string (m4a, wav, mp3, etc)"
}
```

**Response:**
```json
{
  "text": "string",
  "transcription": "string"
}
```

**Example:**
```typescript
const response = await fetch(API_ENDPOINTS.TRANSCRIBE, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    audio: base64Audio,
    format: "m4a"
  })
});

const data = await response.json();
console.log(data.text); // "hello world"
```

---

### 3. History API
**GET** `/history/:sessionId`

Load chat history for a specific session.

**Request Parameters:**
- `sessionId` (string, required): Session ID

**Response:**
```json
{
  "history": [
    {
      "role": "user",
      "message": "What is diabetes?"
    },
    {
      "role": "bot",
      "message": "Diabetes is a condition where..."
    }
  ]
}
```

**Example:**
```typescript
const response = await fetch(API_ENDPOINTS.HISTORY("session123"), {
  method: "GET",
  headers: { "Content-Type": "application/json" }
});

const data = await response.json();
console.log(data.history); // Array of messages
```

---

## Error Handling

All endpoints may return errors:

```json
{
  "error": "string",
  "code": "string",
  "status": 400
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

**Example Error Handling:**
```typescript
try {
  const response = await fetch(API_ENDPOINTS.CHAT, { ... });
  
  if (!response.ok) {
    const error = await response.json();
    console.error("API Error:", error);
    throw new Error(error.message);
  }
  
  // Process response
} catch (error) {
  console.error("Request failed:", error);
  // Show user-friendly error message
}
```

---

## Authentication

Currently, the API requires:
- `user_id`: User identifier
- `session_id`: Chat session identifier

Future: Add JWT token authentication

---

## Rate Limiting

No rate limiting currently implemented. Backend should implement:
- Rate limit: 100 requests per minute per user
- Response: 429 Too Many Requests

---

## Examples

### Send Message with Image
```typescript
import * as ImagePicker from "expo-image-picker";
import { API_ENDPOINTS } from "@/src/config/api";

const result = await ImagePicker.launchImageLibraryAsync({
  base64: true,
  quality: 0.8
});

const response = await fetch(API_ENDPOINTS.CHAT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    session_id: sessionId,
    message: "What's this condition?",
    image: result.assets[0].base64
  })
});
```

### Record and Transcribe Voice
```typescript
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import { API_ENDPOINTS } from "@/src/config/api";

// Record audio
const { recording } = await Audio.Recording.createAsync(...);
await recording.stopAndUnloadAsync();

// Convert to Base64
const base64Audio = await FileSystem.readAsStringAsync(uri, {
  encoding: "base64"
});

// Send to transcribe API
const response = await fetch(API_ENDPOINTS.TRANSCRIBE, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    audio: base64Audio,
    format: "m4a"
  })
});

const data = await response.json();
console.log("Transcribed:", data.text);
```

---

## Configuration

Update API endpoints in `src/config/api.ts`:

```typescript
const API_BASE_URL = "https://your-ngrok-url.ngrok-free.dev";

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,
  TRANSCRIBE: `${API_BASE_URL}/transcribe`,
  HISTORY: (sessionId: string) => `${API_BASE_URL}/history/${sessionId}`,
};
```

---

## Future Enhancements

- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement request/response validation
- [ ] Add API versioning
- [ ] Implement caching
- [ ] Add WebSocket support for real-time updates
