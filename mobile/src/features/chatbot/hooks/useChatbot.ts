import { aiProxyClient } from "@/src/api/aiProxyClient";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import type {
  ChatMessage,
  ChatMessageDto,
  ChatSession,
  IntentMode,
} from "../types/chatbot.types";

function welcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    conversationId: "",
    role: "assistant",
    content:
      "Xin chào! Tôi là trợ lý sức khỏe của bạn. Bạn có thể nhập thông tin sức khỏe hoặc đặt câu hỏi ngay tại đây.",
    timestamp: new Date(),
  };
}

function mapMessage(message: ChatMessageDto): ChatMessage {
  return {
    ...message,
    timestamp: new Date(message.createdAt),
  };
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState("current");
  const [inputMessage, setInputMessage] = useState("");
  const [intentMode, setIntentMode] = useState<IntentMode>("data_collection");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const conversations = await aiProxyClient.listConversations();
      setChatSessions(
        conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title || "Conversation",
          date: new Date(conversation.updatedAt).toLocaleString("vi-VN"),
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải hội thoại.");
    }
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarVisible(false);

    if (conversationId === "current") {
      setCurrentConversationId(null);
      setMessages([welcomeMessage()]);
      return;
    }

    setCurrentConversationId(conversationId);
    setIsLoading(true);
    setError(null);
    try {
      const history = await aiProxyClient.listMessages(conversationId);
      setMessages(history.length ? history.map(mapMessage) : [welcomeMessage()]);
    } catch (historyError) {
      const message =
        historyError instanceof Error ? historyError.message : "Không thể tải lịch sử hội thoại.";
      setError(message);
      Alert.alert("Lỗi", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await aiProxyClient.deleteConversation(conversationId);
      setChatSessions((previous) => previous.filter((session) => session.id !== conversationId));
      if (selectedConversationId === conversationId) {
        setSelectedConversationId("current");
        setCurrentConversationId(null);
        setMessages([welcomeMessage()]);
      }
    } catch (deleteError) {
      Alert.alert(
        "Lỗi",
        deleteError instanceof Error ? deleteError.message : "Không thể xóa hội thoại.",
      );
    }
  }, [selectedConversationId]);

  const sendMessage = useCallback(async () => {
    const content = inputMessage.trim();
    if (!content || isLoading) return;

    setInputMessage("");
    setError(null);
    setMessages((previous) => [
      ...previous,
      {
        id: `local-${Date.now()}`,
        conversationId: currentConversationId ?? "",
        role: "user",
        content,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const conversation = await aiProxyClient.createConversation({ title: content.slice(0, 50) });
        conversationId = conversation.id;
        setCurrentConversationId(conversation.id);
        setSelectedConversationId(conversation.id);
        setChatSessions((previous) => [
          {
            id: conversation.id,
            title: conversation.title || content.slice(0, 50),
            date: new Date(conversation.createdAt).toLocaleString("vi-VN"),
          },
          ...previous,
        ]);
      }

      const result = await aiProxyClient.submitInteraction(conversationId, {
        type: "user_message",
        content,
        intent: intentMode,
      });
      const agentMessages = result.messages.filter((message) => message.role === "assistant");
      setMessages((previous) => [...previous, ...agentMessages.map(mapMessage)]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Không thể gửi tin nhắn.";
      setError(message);
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          conversationId: currentConversationId ?? "",
          role: "assistant",
          content: "Xin lỗi, hiện không thể xử lý yêu cầu. Vui lòng thử lại.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, inputMessage, intentMode, isLoading]);

  const respondToAction = useCallback(async (
    actionId: string,
    decision: "accepted" | "rejected",
  ) => {
    if (!currentConversationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await aiProxyClient.submitInteraction(currentConversationId, {
        type: "action_response",
        actionId,
        decision,
      });
      setMessages((previous) =>
        previous.map((message) => ({
          ...message,
          actions: message.actions?.map((action) =>
            action.id === actionId ? { ...action, status: decision } : action,
          ),
        })),
      );
      setMessages((previous) => [
        ...previous,
        ...result.messages.filter((message) => message.role === "assistant").map(mapMessage),
      ]);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Không thể xác nhận dữ liệu.";
      setError(message);
      Alert.alert("Lỗi", message);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId]);

  const likeMessage = useCallback((messageId: string) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? { ...message, liked: !message.liked, disliked: false }
          : message,
      ),
    );
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? { ...message, disliked: !message.disliked, liked: false }
          : message,
      ),
    );
  }, []);

  return {
    messages,
    chatSessions,
    selectedConversationId,
    inputMessage,
    intentMode,
    sidebarVisible,
    isLoading,
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
  };
}
