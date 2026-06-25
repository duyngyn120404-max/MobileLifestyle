import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/auth-context";
import { HealthProposalConfirmation } from "@/src/features/chatbot/components/HealthProposalConfirmation";
import { useChatbot } from "@/src/features/chatbot/hooks/useChatbot";
import type { ChatMessage, IntentMode } from "@/src/features/chatbot/types/chatbot.types";

const INTENT_OPTIONS: { value: IntentMode; label: string; shortLabel: string; icon: string }[] = [
  { value: "auto", label: "Tự động chọn chế độ", shortLabel: "Tự động", icon: "auto-fix" },
  { value: "personal_medical_qa", label: "Tư vấn theo hồ sơ của tôi", shortLabel: "Hồ sơ của tôi", icon: "account-heart" },
  { value: "general_medical_qa", label: "Hỏi kiến thức sức khỏe", shortLabel: "Kiến thức", icon: "stethoscope" },
  { value: "data_collection", label: "Ghi nhận dữ liệu sức khỏe", shortLabel: "Ghi dữ liệu", icon: "database-plus" },
];

const TAB_BAR_HEIGHT = 64;

const COLORS = {
  background: "#F3F7F7",
  surface: "#FCFEFE",
  surfaceSoft: "#EFF6F6",
  surfaceStrong: "#E3F1F2",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#173238",
  textMuted: "#61787D",
  border: "#D9E7E8",
  success: "#1E9B73",
  danger: "#D95C5C",
  white: "#FFFFFF",
};

function IntentMenu({
  value,
  onSelect,
}: {
  value: IntentMode;
  onSelect: (value: IntentMode) => void;
}) {
  return (
    <View style={intentStyles.popup}>
      {INTENT_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[intentStyles.option, active && intentStyles.optionActive]}
            onPress={() => onSelect(option.value)}
          >
            <MaterialCommunityIcons
              name={option.icon as never}
              size={18}
              color={active ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[intentStyles.optionText, active && intentStyles.optionTextActive]}>
              {option.label}
            </Text>
            {active && (
              <MaterialCommunityIcons name="check" size={17} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getIntentOption(value: IntentMode) {
  return INTENT_OPTIONS.find((option) => option.value === value) ?? INTENT_OPTIONS[0];
}

export default function BotScreen() {
  const insets = useSafeAreaInsets();
  const [intentMenuVisible, setIntentMenuVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const { user } = useAuth();
  const {
    messages,
    chatSessions,
    selectedConversationId,
    inputMessage,
    intentMode,
    sidebarVisible,
    isLoadingMessages,
    isRespondingToAction,
    isLoadingConversations,
    isComposerDisabled,
    isBotThinking,
    processingActionId,
    error,
    setInputMessage,
    setIntentMode,
    setSidebarVisible,
    loadConversations,
    selectConversation,
    deleteConversation,
    sendMessage,
    respondToAction,
    likeMessage,
    dislikeMessage,
  } = useChatbot();

  useEffect(() => {
    if (user?.id) void loadConversations();
  }, [loadConversations, user?.id]);

  const toggleSidebar = () => {
    if (sidebarVisible) {
      setSidebarVisible(false);
      return;
    }

    setSidebarVisible(true);
    if (user?.id) void loadConversations();
  };

  const selectIntent = (value: IntentMode) => {
    setIntentMode(value);
    setIntentMenuVisible(false);
  };

  const submitMessage = () => {
    if (!inputMessage.trim() || isComposerDisabled) return;
    setIntentMenuVisible(false);
    void sendMessage();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const hasContent = item.content.trim().length > 0;
    const hasActions = !isUser && !!item.actions?.length;

    if (!isUser && !hasContent && !hasActions) return null;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.botContainer]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <MaterialCommunityIcons name="robot" size={20} color={COLORS.white} />
          </View>
        )}
        <View style={styles.messageColumn}>
          {hasContent && (
            <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.botMessage]}>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                {item.content}
              </Text>
              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
          {hasActions && (
            <HealthProposalConfirmation
              actions={item.actions ?? []}
              onDecision={respondToAction}
              disabled={isRespondingToAction}
              processingActionId={processingActionId}
            />
          )}
          {!isUser && hasContent && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={[styles.actionButton, item.liked && styles.actionButtonActive]}
                onPress={() => likeMessage(item.id)}
                accessibilityLabel="Hữu ích"
              >
                <MaterialCommunityIcons
                  name={item.liked ? "thumb-up" : "thumb-up-outline"}
                  size={18}
                  color={item.liked ? COLORS.primary : COLORS.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, item.disliked && styles.actionButtonActive]}
                onPress={() => dislikeMessage(item.id)}
                accessibilityLabel="Không hữu ích"
              >
                <MaterialCommunityIcons
                  name={item.disliked ? "thumb-down" : "thumb-down-outline"}
                  size={18}
                  color={item.disliked ? COLORS.danger : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isUser && (
          <View style={styles.userIcon}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.white} />
          </View>
        )}
      </View>
    );
  };

  const showSendButton = inputFocused || !!inputMessage.trim();
  const canSendMessage = !!inputMessage.trim() && !isComposerDisabled;
  const selectedIntent = getIntentOption(intentMode);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
            <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="robot-happy" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Health Bot</Text>
          <TouchableOpacity
            style={[styles.headerModeButton, intentMenuVisible && styles.headerModeButtonActive]}
            onPress={() => setIntentMenuVisible((visible) => !visible)}
            accessibilityLabel="Chọn chế độ chat"
          >
            <MaterialCommunityIcons
              name={selectedIntent.icon as never}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.headerModeText} numberOfLines={1}>{selectedIntent.shortLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newChatButton} onPress={() => void selectConversation("current")}>
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {isLoadingMessages && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="history" size={22} color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải lịch sử hội thoại...</Text>
          </View>
        )}
        {isRespondingToAction && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang xử lý xác nhận...</Text>
          </View>
        )}
        {isBotThinking && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color={COLORS.primary} />
            <Text style={styles.loadingText}>Bot đang suy nghĩ...</Text>
          </View>
        )}

        {intentMenuVisible && (
          <Pressable
            style={styles.intentDismissLayer}
            onPress={() => setIntentMenuVisible(false)}
          >
            <Pressable onPress={(event) => event.stopPropagation()}>
              <IntentMenu value={intentMode} onSelect={selectIntent} />
            </Pressable>
          </Pressable>
        )}
        <View style={[styles.composerArea, { marginBottom: TAB_BAR_HEIGHT }]}> 
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => Alert.alert("Upload file", "Chức năng upload file sẽ được bổ sung sau.")}
              accessibilityLabel="Upload file"
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <View style={[styles.messageInputWrap, inputFocused && styles.messageInputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tin nhắn hoặc dữ liệu sức khỏe..."
                placeholderTextColor={COLORS.textMuted}
                value={inputMessage}
                onChangeText={setInputMessage}
                onFocus={() => {
                  setIntentMenuVisible(false);
                  setInputFocused(true);
                }}
                onBlur={() => setInputFocused(false)}
                multiline
                editable={!isComposerDisabled}
              />
              {showSendButton && (
                <TouchableOpacity
                  style={[styles.sendButton, !canSendMessage && styles.sendButtonDisabled]}
                  onPress={submitMessage}
                  disabled={!canSendMessage}
                >
                  <MaterialCommunityIcons
                    name="arrow-up"
                    size={20}
                    color={canSendMessage ? COLORS.white : COLORS.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

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
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.sessionItem, selectedConversationId === "current" && styles.activeSession]}
              onPress={() => void selectConversation("current")}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sessionItemText}>Cuộc trò chuyện mới</Text>
            </TouchableOpacity>
            {isLoadingConversations && (
              <View style={styles.sidebarLoadingRow}>
                <MaterialCommunityIcons name="loading" size={16} color={COLORS.primary} />
                <Text style={styles.sidebarLoadingText}>Đang tải hội thoại...</Text>
              </View>
            )}
            <ScrollView style={styles.sessionsList}>
              {chatSessions.map((session) => (
                <View
                  key={session.id}
                  style={[
                    styles.sessionItem,
                    selectedConversationId === session.id && styles.activeSession,
                  ]}
                >
                  <TouchableOpacity style={styles.sessionSelect} onPress={() => void selectConversation(session.id)}>
                    <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.textMuted} />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionItemText} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.sessionDate}>{session.date}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => void deleteConversation(session.id)} style={styles.deleteSessionButton}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
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

const intentStyles = StyleSheet.create({
  popup: {
    width: 320,
    maxWidth: "88%",
    padding: 6,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 40,
    elevation: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: { backgroundColor: COLORS.surfaceSoft },
  optionText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: "700" },
  optionTextActive: { color: COLORS.primaryDark },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, flexDirection: "row" },
  mainContent: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  menuButton: { padding: 8, marginLeft: -8 },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}14`,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, flex: 1, minWidth: 0 },
  headerModeButton: { minHeight: 34, maxWidth: 134, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderRadius: 17, backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border },
  headerModeButtonActive: { backgroundColor: COLORS.surfaceStrong, borderColor: COLORS.primary },
  headerModeText: { flexShrink: 1, fontSize: 12, fontWeight: "800", color: COLORS.text },
  newChatButton: { padding: 8, marginRight: -8 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 20 },
  messageContainer: { flexDirection: "row", marginVertical: 10, alignItems: "flex-end", gap: 10, width: "100%" },
  messageColumn: { flex: 1 },
  userContainer: { justifyContent: "flex-end" },
  botContainer: { justifyContent: "flex-start" },
  botIcon: { width: 34, height: 34, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  userIcon: { width: 34, height: 34, borderRadius: 14, backgroundColor: COLORS.success, justifyContent: "center", alignItems: "center" },
  messageBubble: { maxWidth: "100%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  userMessage: { backgroundColor: COLORS.primary, maxWidth: "78%", marginLeft: "auto" },
  botMessage: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  messageText: { fontSize: 15, lineHeight: 21, fontWeight: "500" },
  userText: { color: COLORS.white },
  botText: { color: COLORS.text },
  timestamp: { fontSize: 11, marginTop: 4, textAlign: "right" },
  userTimestamp: { color: "rgba(255, 255, 255, 0.78)" },
  botTimestamp: { color: COLORS.textMuted },
  messageActions: { flexDirection: "row", gap: 8, marginTop: 6, paddingHorizontal: 12 },
  actionButton: { width: 32, height: 32, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border },
  actionButtonActive: { backgroundColor: COLORS.surfaceStrong, borderColor: COLORS.primary },
  errorText: { color: COLORS.danger, fontSize: 13, paddingHorizontal: 16, paddingVertical: 8, fontWeight: "600" },
  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  loadingText: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  intentDismissLayer: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 80, backgroundColor: "rgba(23, 50, 56, 0.20)", justifyContent: "center", alignItems: "center", padding: 24 },
  composerArea: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, zIndex: 30, elevation: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: COLORS.surface, gap: 8 },
  attachButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  messageInputWrap: { flex: 1, minHeight: 46, maxHeight: 100, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceSoft, borderRadius: 23, borderWidth: 1, borderColor: COLORS.border, paddingLeft: 16, paddingRight: 4, paddingVertical: 4 },
  messageInputWrapFocused: { borderColor: COLORS.primary },
  input: { flex: 1, minHeight: 36, paddingVertical: 7, paddingRight: 8, fontSize: 15, color: COLORS.text, maxHeight: 92 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  sendButtonDisabled: { backgroundColor: COLORS.surfaceStrong },
  sidebarOverlay: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 99 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 260, backgroundColor: COLORS.surface, zIndex: 101 },
  sidebarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sidebarTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sidebarLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sidebarLoadingText: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  sessionsList: { flex: 1 },
  sessionItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  activeSession: { backgroundColor: COLORS.surfaceSoft, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  sessionSelect: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  sessionInfo: { flex: 1 },
  sessionItemText: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sessionDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  deleteSessionButton: { padding: 6, marginRight: 4 },
});
