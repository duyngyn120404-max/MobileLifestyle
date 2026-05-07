import { apiClient, ConversationRecord, MessageRecord, IngestionResult } from '@/src/config/apiClient';
import type { Message, ChatSession, ReviewRecord } from '@/src/types';

const CLINICAL_FACT_LABELS: Record<string, string> = {
  // Risk factors
  diabetes:                     'Tiểu đường',
  smoking:                      'Hút thuốc',
  overweight:                   'Thừa cân/béo phì',
  heartRateOver80:              'Nhịp tim > 80',
  highLDLOrTriglyceride:        'Mỡ máu cao (LDL/triglyceride)',
  familialHypercholesterolemia: 'Tăng cholesterol gia đình',
  familyHistoryOfHypertension:  'Tiền sử gia đình tăng huyết áp',
  sedentaryLifestyle:           'Ít vận động',
  ageOver65:                    'Tuổi > 65',
  male:                         'Giới tính nam',
  earlyMenopause:               'Mãn kinh sớm',
  menopause:                    'Mãn kinh',
  environmentalSocioeconomicFactors: 'Yếu tố môi trường/kinh tế xã hội',
  // HMOD
  leftVentricularHypertrophy:   'Phì đại thất trái',
  kidneyDamage:                 'Tổn thương thận',
  pulsePressureOver60:          'Áp lực mạch > 60',
  brainDamage:                  'Tổn thương não',
  heartDamage:                  'Tổn thương tim',
  vascularDamage:               'Tổn thương mạch máu',
  ckdStage3:                    'Bệnh thận mạn giai đoạn 3',
  // CVD
  coronaryArteryDisease:        'Bệnh động mạch vành',
  heartFailure:                 'Suy tim',
  stroke:                       'Đột quỵ',
  peripheralVascularDisease:    'Bệnh mạch máu ngoại vi',
  atrialFibrillation:           'Rung nhĩ',
  ckdStage4:                    'Bệnh thận mạn giai đoạn 4',
  ckdStage5:                    'Bệnh thận mạn giai đoạn 5',
};

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
  ): Promise<{ botContent: string; ingestionResult?: IngestionResult; needsClarification: boolean }> {
    const resp = await apiClient.sendMessage(conversationId, content, intent);
    return {
      botContent: resp.content,
      ingestionResult: resp.ingestion_result,
      needsClarification: resp.ingestion_result?.needs_clarification ?? false,
    };
  },

  buildReviewItems(ingestionResult: IngestionResult): ReviewRecord[] {
    if (ingestionResult.needs_clarification) return [];
    const items: ReviewRecord[] = [];

    // BP records — map each inserted ID to the corresponding extraction reading
    const bpReadings = ingestionResult.extraction?.bp_readings ?? [];
    ingestionResult.inserted.bp_records.forEach((id, i) => {
      const r = bpReadings[i];
      const period = r?.day_period === 'morning' ? ' (sáng)' : r?.day_period === 'afternoon' ? ' (chiều)' : r?.day_period === 'evening' ? ' (tối)' : r?.day_period === 'night' ? ' (đêm)' : '';
      const label = r
        ? `Huyết áp: ${r.systolic}/${r.diastolic} mmHg${period}`
        : `Chỉ số huyết áp #${i + 1}`;
      items.push({ table: 'bp_records', recordId: id, label, decision: null });
    });

    // Clinical facts — backend already filtered to value=true only, with fact_key
    ingestionResult.inserted.clinical_facts.forEach((cf) => {
      const label = CLINICAL_FACT_LABELS[cf.fact_key] ?? cf.fact_key;
      items.push({ table: 'clinical_facts', recordId: cf.id, label, decision: null });
    });

    return items;
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
