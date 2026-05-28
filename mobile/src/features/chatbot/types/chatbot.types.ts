export type IntentMode =
  | "auto"
  | "personal_medical_qa"
  | "general_medical_qa"
  | "data_collection";

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingAction {
  id: string;
  type: "confirm_health_data";
  status: "pending" | "accepted" | "rejected";
  summary: string;
  details?: { label: string; value: string }[];
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  actions?: PendingAction[];
}

export interface ChatMessage extends Omit<ChatMessageDto, "createdAt"> {
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}

export type UserMessageInteraction = {
  type: "user_message";
  content: string;
  intent?: IntentMode;
};

export type ActionResponseInteraction = {
  type: "action_response";
  actionId: string;
  decision: "accepted" | "rejected";
};

export type SubmitInteractionRequest =
  | UserMessageInteraction
  | ActionResponseInteraction;

export interface SubmitInteractionResponse {
  messages: ChatMessageDto[];
}
