import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { env } from "./env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== "web" ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type { Session, User } from "@supabase/supabase-js";

export const TABLES = {
  USERS: "users",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  FEEDBACK: "feedback",
  BP_RECORDS: "bp_records",
  CLINICAL_FACTS: "clinical_facts",
  CLINICAL_CLASSIFICATIONS: "clinical_classifications",
  CLASSIFICATION_USABILITY: "classification_usability",
  MEASUREMENT_EVALUATION: "measurement_evaluation",
  CLINICAL_REASONINGS: "clinical_reasonings",
  RISK_ASSESSMENTS: "risk_assessments",
  RISK_REASONINGS: "risk_reasonings",
} as const;

export const DATABASE_ID = "default";

export const HEALTH_RECORDS_COLLECTION_ID = TABLES.BP_RECORDS;
export const HEALTH_ALERTS_COLLECTION_ID = TABLES.CLINICAL_FACTS;
export const USER_PROFILES_COLLECTION_ID = TABLES.USERS;
export const SESSIONS_COLLECTION_ID = TABLES.CONVERSATIONS;
