import { Account, Client, Databases } from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!) // Your Appwrite
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!); // Your project ID

export const account = new Account(client);

export const databases = new Databases(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_DB_ID!;

export const HEALTH_RECORDS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_HEALTH_RECORD_COLLECTION_ID!;

export const HEALTH_ALERTS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_HEALTH_ALERTS_COLLECTION_ID!;

export const USER_PROFILES_COLLECTION_ID =
  process.env.EXPO_PUBLIC_USER_PROFILES_COLLECTION_ID!;

export const SESSIONS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_CHAT_SESSIONS_COLLECTION_ID!;

export interface RealTimeResponse {
  events: string[];
  payload: any;
}
