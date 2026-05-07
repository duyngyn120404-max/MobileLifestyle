import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { chatService } from '@/src/services/chat.service';
import { audioService } from '@/src/services/audio.service';
import { apiClient } from '@/src/config/apiClient';
import type { Message, ChatSession, IntentMode } from '@/src/types';
import { Audio } from 'expo-av';

export const useChatController = () => {
  const [messages, setMessages] = useState<Message[]>([chatService.buildWelcomeMessage()]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('current');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [intentMode, setIntentMode] = useState<IntentMode>('data_collection');
  const recordingRef = useRef<Audio.Recording | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await chatService.getSessions();
      setChatSessions(sessions);
    } catch (err) {
      console.error('Error loading chat sessions:', err);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      image: selectedImage?.uri,
    };

    setMessages(prev => [...prev, userMessage]);
    const sentContent = inputMessage;
    setInputMessage('');
    setSelectedImage(null);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMessageId, type: 'bot', content: '', timestamp: new Date() }]);

    try {
      let convId = currentSessionId;
      if (!convId) {
        const conv = await chatService.createSession(sentContent.substring(0, 50));
        convId = conv.id;
        setCurrentSessionId(convId);
        setSelectedSessionId(convId);
        setChatSessions(prev => [{
          id: conv.id,
          title: conv.title || sentContent.substring(0, 50),
          date: new Date(conv.created_at).toLocaleString('vi-VN'),
        }, ...prev]);
      }

      const { botContent, ingestionResult, needsClarification } = await chatService.sendMessage(convId, sentContent, intentMode);

      const reviewItems = ingestionResult && !needsClarification
        ? chatService.buildReviewItems(ingestionResult)
        : undefined;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, content: botContent, reviewItems: reviewItems?.length ? reviewItems : undefined }
            : msg
        )
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, content: 'Xin lỗi, có lỗi kết nối. Vui lòng thử lại!' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, selectedImage, currentSessionId, intentMode]);

  const reviewRecord = useCallback(async (
    messageId: string,
    recordIndex: number,
    decision: 'accepted' | 'rejected'
  ) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.reviewItems) return;
    const item = msg.reviewItems[recordIndex];

    // Optimistically update UI
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId || !m.reviewItems) return m;
        return {
          ...m,
          reviewItems: m.reviewItems.map((r, i) =>
            i === recordIndex ? { ...r, decision } : r
          ),
        };
      })
    );

    try {
      await apiClient.reviewRecord(item.table, item.recordId, decision);
    } catch (err) {
      console.error('Error reviewing record:', err);
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId || !m.reviewItems) return m;
          return {
            ...m,
            reviewItems: m.reviewItems.map((r, i) =>
              i === recordIndex ? { ...r, decision: null } : r
            ),
          };
        })
      );
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  }, [messages]);

  const selectSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSidebarVisible(false);
    setSelectedImage(null);

    if (sessionId === 'current') {
      setCurrentSessionId(null);
      setMessages([chatService.buildWelcomeMessage()]);
      return;
    }

    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
      const loaded = await chatService.loadSessionHistory(sessionId);
      setMessages(loaded.length > 0 ? loaded : [chatService.buildWelcomeMessage()]);
    } catch {
      setMessages([{ id: '1', type: 'bot', content: 'Xin lỗi, không thể tải lịch sử cuộc trò chuyện.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await chatService.deleteSession(sessionId);
    } catch (err) {
      console.error('Error deleting session:', err);
    }
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (selectedSessionId === sessionId) selectSession('current');
  }, [selectedSessionId, selectSession]);

  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      const recording = await audioService.startRecording();
      recordingRef.current = recording;
    } catch {
      setIsRecording(false);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    try {
      const uri = await audioService.stopRecording(recordingRef.current);
      recordingRef.current = null;
      if (!uri) return;

      setIsLoading(true);
      const text = await audioService.transcribe(uri);
      if (text) setInputMessage(prev => prev + (prev ? ' ' : '') + text);
    } catch {
      Alert.alert('Lỗi', 'Không thể nhận diện giọng nói');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const speakMessage = useCallback(async (content: string) => {
    try {
      setIsSpeaking(true);
      await audioService.speak(content);
    } catch {
      Alert.alert('Lỗi', 'Không thể phát âm thanh');
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const likeMessage = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, liked: !msg.liked, disliked: false } : msg)
    );
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, disliked: !msg.disliked, liked: false } : msg)
    );
  }, []);

  return {
    messages,
    chatSessions,
    currentSessionId,
    selectedSessionId,
    inputMessage,
    selectedImage,
    isLoading,
    isSpeaking,
    isRecording,
    sidebarVisible,
    intentMode,
    setIntentMode,
    setInputMessage,
    setSelectedImage,
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
  };
};
