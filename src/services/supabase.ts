import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Re-export commonly used modules
export type { Session, User } from '@supabase/supabase-js';

// Table names (for type safety)
export const TABLES = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  FEEDBACK: 'feedback',
  BP_RECORDS: 'bp_records',
  CLINICAL_FACTS: 'clinical_facts',
  CLINICAL_CLASSIFICATIONS: 'clinical_classifications',
  CLASSIFICATION_USABILITY: 'classification_usability',
  MEASUREMENT_EVALUATION: 'measurement_evaluation',
  CLINICAL_REASONINGS: 'clinical_reasonings',
  RISK_ASSESSMENTS: 'risk_assessments',
  RISK_REASONINGS: 'risk_reasonings',
} as const;

// Database IDs (for consistency with Appwrite style)
export const DATABASE_ID = 'default'; // Not needed in Supabase, kept for compatibility

// Collection IDs (kept for compatibility)
export const HEALTH_RECORDS_COLLECTION_ID = TABLES.BP_RECORDS;
export const HEALTH_ALERTS_COLLECTION_ID = TABLES.CLINICAL_FACTS;
export const USER_PROFILES_COLLECTION_ID = TABLES.USERS;
export const SESSIONS_COLLECTION_ID = TABLES.CONVERSATIONS;
