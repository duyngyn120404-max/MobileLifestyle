import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { useChatController } from "@/src/controllers/useChatController";
import { Message, ReviewRecord, IntentMode } from "@/src/types";
import { apiClient } from "@/src/config/apiClient";

import { audioService } from "@/src/services/audio.service";

// ── Intent selector ────────────────────────────────────────────────────────

const INTENT_OPTIONS: { value: IntentMode; label: string; icon: string }[] = [
  { value: "personal_medical_qa", label: "Cá nhân",    icon: "account-heart" },
  { value: "general_medical_qa",  label: "Tổng quát",  icon: "stethoscope" },
  { value: "data_collection",     label: "Ghi nhận",   icon: "database-plus" },
];

function IntentSelector({
  value,
  onChange,
}: {
  value: IntentMode;
  onChange: (v: IntentMode) => void;
}) {
  return (
    <View style={intentStyles.row}>
      {INTENT_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[intentStyles.chip, active && intentStyles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={13}
              color={active ? "#fff" : "#555"}
            />
            <Text style={[intentStyles.chipText, active && intentStyles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const intentStyles = StyleSheet.create({
  row: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
    backgroundColor: "#fff",
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ddd",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 12, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
});

// ── Review card ────────────────────────────────────────────────────────────

function ReviewCard({
  messageId,
  items,
  onReview,
}: {
  messageId: string;
  items: ReviewRecord[];
  onReview: (messageId: string, index: number, decision: "accepted" | "rejected") => void;
}) {
  const allDone = items.every(r => r.decision !== null);

  if (allDone) return null;

  return (
    <View style={reviewStyles.card}>
      <View style={reviewStyles.cardHeader}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#007AFF" />
        <Text style={reviewStyles.cardTitle}>Xác nhận dữ liệu đã ghi nhận</Text>
      </View>
      {items.map((item, index) => {
        if (item.decision !== null) return null;
        return (
          <View key={item.recordId} style={reviewStyles.row}>
            <Text style={reviewStyles.rowLabel}>{item.label}</Text>
            {item.details && item.details.length > 0 && (
              <View style={reviewStyles.detailsGrid}>
                {item.details.map(d => (
                  <View key={d.label} style={reviewStyles.detailChip}>
                    <Text style={reviewStyles.detailKey}>{d.label}: </Text>
                    <Text style={reviewStyles.detailValue}>{d.value}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={reviewStyles.btnGroup}>
              <TouchableOpacity
                style={[reviewStyles.btn, reviewStyles.acceptBtn]}
                onPress={() => onReview(messageId, index, "accepted")}
              >
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
                <Text style={reviewStyles.btnText}>Xác nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[reviewStyles.btn, reviewStyles.rejectBtn]}
                onPress={() => onReview(messageId, index, "rejected")}
              >
                <MaterialCommunityIcons name="close" size={14} color="#fff" />
                <Text style={reviewStyles.btnText}>Bỏ qua</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  card: {
    marginTop: 8, marginHorizontal: 12, backgroundColor: "#F0F7FF",
    borderRadius: 12, borderWidth: 1, borderColor: "#C5DFF8", padding: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#007AFF" },
  row: { flexDirection: "column", gap: 6, marginBottom: 10 },
  rowLabel: { fontSize: 13, fontWeight: "600", color: "#222" },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  detailChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#E8F1FB", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  detailKey: { fontSize: 11, color: "#555" },
  detailValue: { fontSize: 11, color: "#1a5fa8", fontWeight: "600" },
  btnGroup: { flexDirection: "row", gap: 8, marginTop: 2 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  acceptBtn: { backgroundColor: "#34C759" },
  rejectBtn: { backgroundColor: "#FF3B30" },
  btnText: { fontSize: 12, color: "#fff", fontWeight: "600" },
});

// ── BP Input Form ──────────────────────────────────────────────────────────

type BPFormState = {
  systolic: string;
  diastolic: string;
  position: 'sitting' | 'standing' | 'lying' | null;
  day_period: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  rested_minutes: string;
  source: 'HBPM' | 'OBPM' | 'ABPM';
};

const POSITION_OPTIONS = [
  { value: 'sitting' as const,  label: 'Ngồi' },
  { value: 'standing' as const, label: 'Đứng' },
  { value: 'lying' as const,    label: 'Nằm' },
];

const DAY_PERIOD_OPTIONS = [
  { value: 'morning' as const,   label: 'Sáng' },
  { value: 'afternoon' as const, label: 'Chiều' },
  { value: 'evening' as const,   label: 'Tối' },
  { value: 'night' as const,     label: 'Đêm' },
];

const SOURCE_OPTIONS = [
  { value: 'HBPM' as const, label: 'Tại nhà' },
  { value: 'OBPM' as const, label: 'Phòng khám' },
  { value: 'ABPM' as const, label: 'Máy 24h' },
];

function BPInputForm({
  visible,
  userId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: (recordId: string) => void;
}) {
  const [form, setForm] = useState<BPFormState>({
    systolic: '',
    diastolic: '',
    position: null,
    day_period: null,
    rested_minutes: '',
    source: 'HBPM',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof BPFormState>(key: K, value: BPFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const sys = parseInt(form.systolic);
    const dia = parseInt(form.diastolic);
    if (!sys || !dia) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chỉ số huyết áp.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.ingestBP({
        user_id: userId,
        systolic: sys,
        diastolic: dia,
        source: form.source,
        position: form.position ?? undefined,
        day_period: form.day_period ?? undefined,
        rested_minutes: form.rested_minutes ? parseFloat(form.rested_minutes) : undefined,
      });
      setForm({ systolic: '', diastolic: '', position: null, day_period: null, rested_minutes: '', source: 'HBPM' });
      onSuccess(res.record_id);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể ghi nhận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bpStyles.modalContainer}>
        <TouchableOpacity style={bpStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={bpStyles.sheet}>
        <View style={bpStyles.handle} />
        <Text style={bpStyles.title}>Nhập chỉ số huyết áp</Text>

        {/* BP numbers */}
        <View style={bpStyles.bpRow}>
          <View style={bpStyles.bpField}>
            <Text style={bpStyles.label}>Tâm thu (trên)</Text>
            <TextInput
              style={bpStyles.bpInput}
              keyboardType="number-pad"
              placeholder="120"
              value={form.systolic}
              onChangeText={v => set('systolic', v)}
            />
          </View>
          <Text style={bpStyles.slash}>/</Text>
          <View style={bpStyles.bpField}>
            <Text style={bpStyles.label}>Tâm trương (dưới)</Text>
            <TextInput
              style={bpStyles.bpInput}
              keyboardType="number-pad"
              placeholder="80"
              value={form.diastolic}
              onChangeText={v => set('diastolic', v)}
            />
          </View>
          <Text style={bpStyles.unit}>mmHg</Text>
        </View>

        {/* Source */}
        <Text style={bpStyles.label}>Nơi đo</Text>
        <View style={bpStyles.chipRow}>
          {SOURCE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[bpStyles.chip, form.source === opt.value && bpStyles.chipActive]}
              onPress={() => set('source', opt.value)}
            >
              <Text style={[bpStyles.chipText, form.source === opt.value && bpStyles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Position */}
        <Text style={bpStyles.label}>Tư thế đo</Text>
        <View style={bpStyles.chipRow}>
          {POSITION_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[bpStyles.chip, form.position === opt.value && bpStyles.chipActive]}
              onPress={() => set('position', opt.value)}
            >
              <Text style={[bpStyles.chipText, form.position === opt.value && bpStyles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day period */}
        <Text style={bpStyles.label}>Buổi đo</Text>
        <View style={bpStyles.chipRow}>
          {DAY_PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[bpStyles.chip, form.day_period === opt.value && bpStyles.chipActive]}
              onPress={() => set('day_period', opt.value)}
            >
              <Text style={[bpStyles.chipText, form.day_period === opt.value && bpStyles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rested minutes */}
        <Text style={bpStyles.label}>Nghỉ ngơi trước đo (phút)</Text>
        <TextInput
          style={bpStyles.textInput}
          keyboardType="number-pad"
          placeholder="VD: 5"
          value={form.rested_minutes}
          onChangeText={v => set('rested_minutes', v)}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[bpStyles.submitBtn, submitting && bpStyles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={bpStyles.submitText}>{submitting ? 'Đang ghi nhận...' : 'Ghi nhận'}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
}

const bpStyles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, gap: 10,
  },
  handle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 4 },
  bpRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 4 },
  bpField: { flex: 1 },
  bpInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#111',
  },
  slash: { fontSize: 28, fontWeight: '300', color: '#999', paddingBottom: 10 },
  unit: { fontSize: 13, color: '#999', paddingBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#444', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  textInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#111', marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#007AFF', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#99c4f5' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function BotScreen() {
  const { user } = useAuth();
  const {
    messages,
    chatSessions,
    selectedSessionId,
    inputMessage,
    isLoading,
    isRecording,
    sidebarVisible,
    intentMode,
    setIntentMode,
    setInputMessage,
    setSidebarVisible,
    loadSessions,
    sendMessage,
    selectSession,
    deleteSession,
    reviewRecord,
    startRecording,
    stopRecording,
    speakMessage,
    likeMessage,
    dislikeMessage,
  } = useChatController();

  const [bpFormVisible, setBpFormVisible] = useState(false);

  useEffect(() => {
    audioService.requestPermissions();
  }, []);

  useEffect(() => {
    if (user?.id) loadSessions();
  }, [user?.id]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === "user";

    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.botContainer]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <MaterialCommunityIcons name="robot" size={20} color="#fff" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.botMessage]}>
            <View style={styles.messageContentWrapper}>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                {item.content}
              </Text>
              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>

          {!isUser && item.reviewItems && item.reviewItems.length > 0 && (
            <ReviewCard
              messageId={item.id}
              items={item.reviewItems}
              onReview={reviewRecord}
            />
          )}

          {!isUser && (
            <View style={styles.messageActionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, item.liked && styles.actionButtonActive]}
                onPress={() => likeMessage(item.id)}
              >
                <MaterialCommunityIcons
                  name={item.liked ? "thumb-up" : "thumb-up-outline"}
                  size={18}
                  color={item.liked ? "#007AFF" : "#999"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, item.disliked && styles.actionButtonActive]}
                onPress={() => dislikeMessage(item.id)}
              >
                <MaterialCommunityIcons
                  name={item.disliked ? "thumb-down" : "thumb-down-outline"}
                  size={18}
                  color={item.disliked ? "#FF3B30" : "#999"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => speakMessage(item.content)}>
                <MaterialCommunityIcons name="volume-high" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isUser && (
          <View style={styles.userIcon}>
            <MaterialCommunityIcons name="account" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarVisible(!sidebarVisible)}>
            <MaterialCommunityIcons name="menu" size={28} color="#007AFF" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="robot-happy" size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Health Bot</Text>
          <TouchableOpacity style={styles.newChatButton} onPress={() => selectSession("current")}>
            <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#007AFF" />
            <Text style={styles.loadingText}>Bot đang suy nghĩ...</Text>
          </View>
        )}

        {/* Intent selector + Input */}
        <IntentSelector value={intentMode} onChange={setIntentMode} />
        {intentMode === 'data_collection' ? (
          <TouchableOpacity style={styles.bpTriggerBtn} onPress={() => { console.log('BP button pressed, visible:', bpFormVisible); setBpFormVisible(true); }}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#fff" />
            <Text style={styles.bpTriggerText}>Nhập chỉ số huyết áp</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn hoặc nói..."
              placeholderTextColor="#999"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              editable={!isLoading && !isRecording}
            />
            <TouchableOpacity
              style={[styles.iconButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <MaterialCommunityIcons
                name={isRecording ? "microphone-off" : "microphone"}
                size={24}
                color={isRecording ? "#FF3B30" : "#007AFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={isLoading || !inputMessage.trim() || isRecording}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={(isLoading || !inputMessage.trim() || isRecording) ? "#ccc" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Overlay & Sidebar */}
      {sidebarVisible && (
        <>
          <TouchableOpacity
            style={styles.sidebarOverlay}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Lịch sử trò chuyện</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sessionItem, selectedSessionId === "current" && styles.activeSession]}
              onPress={() => selectSession("current")}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.sessionItemText}>Cuộc trò chuyện mới</Text>
            </TouchableOpacity>

            <ScrollView style={styles.sessionsList}>
              {chatSessions.map(session => (
                <View
                  key={session.id}
                  style={[styles.sessionItem, selectedSessionId === session.id && styles.activeSession]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                    onPress={() => selectSession(session.id)}
                  >
                    <MaterialCommunityIcons name="chat-outline" size={20} color="#666" />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionItemText} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.sessionDate}>{session.date}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSession(session.id)} style={styles.deleteSessionButton}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </KeyboardAvoidingView>

    <BPInputForm
      visible={bpFormVisible}
      userId={user?.id ?? ''}
      onClose={() => setBpFormVisible(false)}
      onSuccess={() => {
        setBpFormVisible(false);
        Alert.alert('Đã ghi nhận', 'Chỉ số huyết áp đã được lưu thành công.');
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", flexDirection: "row" },
  mainContent: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 12, paddingTop: 50, backgroundColor: "#E3F2FD", gap: 12,
  },
  menuButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333", flex: 1 },
  newChatButton: { padding: 8, marginRight: -8 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 16, paddingVertical: 12 },
  messageContainer: { flexDirection: "row", marginVertical: 10, alignItems: "flex-end", gap: 10 },
  userContainer: { justifyContent: "flex-end", marginLeft: "auto", marginRight: 0, width: "100%" },
  botContainer: { justifyContent: "flex-start", marginRight: "auto", marginLeft: 0, width: "100%" },
  botIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" },
  userIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#34C759", justifyContent: "center", alignItems: "center" },
  messageBubble: {
    maxWidth: "60%", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    justifyContent: "center", alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  userMessage: { backgroundColor: "#b3b3b3", maxWidth: "70%", marginLeft: "auto" },
  botMessage: { backgroundColor: "#fff", borderWidth: 0, maxWidth: "100%" },
  messageText: { fontSize: 15, lineHeight: 21, fontWeight: "500" },
  userText: { color: "#000", fontSize: 15 },
  botText: { color: "#333", fontSize: 16, fontWeight: "500" },
  messageContentWrapper: { width: "100%" },
  timestamp: { fontSize: 11, marginTop: 4, fontWeight: "400", textAlign: "right" },
  userTimestamp: { color: "rgba(0, 0, 0, 0.6)", textAlign: "right" },
  botTimestamp: { color: "#999" },
  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  loadingText: { color: "#007AFF", fontSize: 14, fontWeight: "500" },
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16,
    paddingVertical: 14, backgroundColor: "#fff", gap: 10,
  },
  bpTriggerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    margin: 16, padding: 16, backgroundColor: "#007AFF", borderRadius: 14,
  },
  bpTriggerText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  input: {
    flex: 1, backgroundColor: "#f5f5f5", borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 11, fontSize: 15, color: "#333", maxHeight: 100,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#007AFF",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#007AFF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 4,
  },
  sendButtonDisabled: { backgroundColor: "#ddd", shadowOpacity: 0, elevation: 0 },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  sidebarOverlay: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 99 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 224, backgroundColor: "#fff", zIndex: 101, flexDirection: "column" },
  sidebarHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16, paddingTop: 50,
    borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  sidebarTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  sessionsList: { flex: 1 },
  sessionItem: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5", gap: 12,
  },
  activeSession: { backgroundColor: "#EBF5FF", borderLeftWidth: 3, borderLeftColor: "#007AFF" },
  sessionInfo: { flex: 1 },
  sessionItemText: { fontSize: 14, fontWeight: "500", color: "#333" },
  sessionDate: { fontSize: 12, color: "#999", marginTop: 2 },
  deleteSessionButton: { padding: 6, marginRight: 4 },
  recordingButton: { backgroundColor: "#FFE5E5", borderWidth: 1.5, borderColor: "#FF3B30" },
  messageActionsContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, paddingHorizontal: 12 },
  actionButton: {
    width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center",
    backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#eee",
  },
  actionButtonActive: { backgroundColor: "#e8f4ff", borderColor: "#007AFF" },
});
