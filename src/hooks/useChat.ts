/**
 * Custom hook for chat operations
 */

import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import * as Speech from "expo-speech";
import type { Message } from "@/src/types";
import { cleanTextForSpeech } from "@/src/utils/formatting";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isSpeaking: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  speakMessage: (content: string) => Promise<void>;
  likeMessage: (messageId: string) => void;
  dislikeMessage: (messageId: string) => void;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<any>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, content } : msg))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const speakMessage = useCallback(async (content: string) => {
    try {
      setIsSpeaking(true);
      const cleanedText = cleanTextForSpeech(content);
      const sentences = cleanedText.split(/([.!?])\s+/).filter(s => s.trim());

      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i]?.trim();
        if (sentence) {
          await Speech.speak(sentence, {
            language: "vi",
            rate: 0.9,
          });

          // Pause between sentences
          if (i + 2 < sentences.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
    } catch (error) {
      console.error("Error speaking message:", error);
      Alert.alert("Lỗi", "Không thể phát âm thanh");
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const likeMessage = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, liked: !msg.liked, disliked: false }
          : msg
      )
    );
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, disliked: !msg.disliked, liked: false }
          : msg
      )
    );
  }, []);

  return {
    messages,
    isLoading,
    isSpeaking,
    addMessage,
    updateMessage,
    clearMessages,
    speakMessage,
    likeMessage,
    dislikeMessage,
  };
};
