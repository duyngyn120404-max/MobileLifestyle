// API Configuration
// Change API_BASE_URL based on your environment

const API_BASE_URL = "https://tremendously-adiaphoristic-winston.ngrok-free.dev"; 

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,
  TRANSCRIBE: `${API_BASE_URL}/transcribe`,
  HISTORY: (sessionId: string) => `${API_BASE_URL}/history/${sessionId}`,
};

export default API_ENDPOINTS;
        