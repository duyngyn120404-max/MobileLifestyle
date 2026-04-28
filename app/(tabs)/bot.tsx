import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { useChatController } from "@/src/controllers/useChatController";
import { Message, ReviewRecord, IntentMode } from "@/src/types";
import { audioService } from "@/src/services/audio.service";

// ── Intent selector ────────────────────────────────────────────────────────

const INTENT_OPTIONS: { value: IntentMode; label: string; icon: string }[] = [
  { value: "auto",                label: "Tự động",    icon: "auto-fix" },
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

// ── Confirm card (ask before showing review) ──────────────────────────────

function ConfirmCard({
  messageId,
  onConfirm,
  onCancel,
}: {
  messageId: string;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <View style={confirmStyles.card}>
      <View style={confirmStyles.header}>
        <MaterialCommunityIcons name="database-plus" size={16} color="#007AFF" />
        <Text style={confirmStyles.title}>Bạn có muốn lưu thông tin này không?</Text>
      </View>
      <View style={confirmStyles.actions}>
        <TouchableOpacity style={[confirmStyles.btn, confirmStyles.saveBtn]} onPress={() => onConfirm(messageId)}>
          <MaterialCommunityIcons name="check" size={14} color="#fff" />
          <Text style={confirmStyles.btnText}>Lưu lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[confirmStyles.btn, confirmStyles.skipBtn]} onPress={() => onCancel(messageId)}>
          <MaterialCommunityIcons name="close" size={14} color="#666" />
          <Text style={[confirmStyles.btnText, { color: "#666" }]}>Không lưu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const confirmStyles = StyleSheet.create({
  card: {
    marginTop: 8, marginHorizontal: 12, backgroundColor: "#F0F7FF",
    borderRadius: 12, borderWidth: 1, borderColor: "#C5DFF8", padding: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: "600", color: "#007AFF", flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 8,
  },
  saveBtn: { backgroundColor: "#007AFF" },
  skipBtn: { backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ddd" },
  btnText: { fontSize: 13, color: "#fff", fontWeight: "600" },
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
        const label = item.table === "bp_records"
          ? `Chỉ số huyết áp #${index + 1}`
          : `Thông tin lâm sàng #${index + 1}`;
        return (
          <View key={item.recordId} style={reviewStyles.row}>
            <Text style={reviewStyles.rowLabel} numberOfLines={1}>{label}</Text>
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
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  rowLabel: { flex: 1, fontSize: 13, color: "#333" },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  acceptBtn: { backgroundColor: "#34C759" },
  rejectBtn: { backgroundColor: "#FF3B30" },
  btnText: { fontSize: 12, color: "#fff", fontWeight: "600" },
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
    confirmReview,
    cancelReview,
    startRecording,
    stopRecording,
    speakMessage,
    likeMessage,
    dislikeMessage,
  } = useChatController();

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

          {!isUser && item.pendingConfirm && (
            <ConfirmCard
              messageId={item.id}
              onConfirm={confirmReview}
              onCancel={cancelReview}
            />
          )}

          {!isUser && !item.pendingConfirm && item.reviewItems && item.reviewItems.length > 0 && (
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
