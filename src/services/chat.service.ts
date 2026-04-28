import { apiClient, ConversationRecord, MessageRecord, IngestionResult } from '@/src/config/apiClient';
import type { Message, ChatSession, ReviewRecord } from '@/src/types';

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    const conversations = await apiClient.listConversations();
    return conversations.map((c: ConversationRecord) => ({
      id: c.id,
      title: c.title || 'Conversation',
      date: new Date(c.updated_at).toLocaleString('vi-VN'),
    }));
  },

  async createSession(title: string): Promise<ConversationRecord> {
    return apiClient.createConversation(title);
  },

  async deleteSession(conversationId: string): Promise<void> {
    return apiClient.deleteConversation(conversationId);
  },

  async loadSessionHistory(conversationId: string): Promise<Message[]> {
    const messages = await apiClient.getMessages(conversationId);
    return messages.map((msg: MessageRecord, index: number) => ({
      id: msg.id || `${conversationId}-${index}`,
      type: msg.role === 'user' ? 'user' : 'bot',
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }));
  },

  async sendMessage(
    conversationId: string,
    content: string,
    intent?: string
  ): Promise<{ botContent: string; ingestionResult?: IngestionResult }> {
    const resp = await apiClient.sendMessage(conversationId, content, intent);
    return {
      botContent: resp.content,
      ingestionResult: resp.ingestion_result,
    };
  },

  buildReviewItems(ingestionResult: IngestionResult): {
    reviewItems: ReviewRecord[];
    autoAcceptIds: { table: 'bp_records' | 'clinical_facts'; recordId: string }[];
  } {
    // Only ask user to review bp_records — clinical_facts are auto-accepted silently
    const reviewItems: ReviewRecord[] = ingestionResult.inserted.bp_records.map(id => ({
      table: 'bp_records' as const,
      recordId: id,
      decision: null,
    }));
    const autoAcceptIds = ingestionResult.inserted.clinical_facts.map(id => ({
      table: 'clinical_facts' as const,
      recordId: id,
    }));
    return { reviewItems, autoAcceptIds };
  },

  buildWelcomeMessage(): Message {
    return {
      id: '1',
      type: 'bot',
      content: 'Xin chào! 👋 Tôi là trợ lý sức khỏe của bạn. Tôi có thể giúp bạn:\n\n• Tư vấn về sức khỏe cá nhân\n• Giải thích các chỉ số y tế\n• Ghi nhận chỉ số sức khỏe của bạn\n\nBạn cần tôi giúp gì?',
      timestamp: new Date(),
    };
  },
};
