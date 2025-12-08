import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { databases, DATABASE_ID, SESSIONS_COLLECTION_ID } from "@/src/services/appwrite";
import { Message, ChatSession } from "@/src/types";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { API_ENDPOINTS } from "@/src/config/api";

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function BotScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Xin chào! 👋 Tôi là trợ lý sức khỏe của bạn. Tôi có thể giúp bạn:\n\n• Tư vấn về sức khỏe\n• Giải thích các chỉ số\n• Gợi ý lối sống lành mạnh\n\nBạn cần tôi giúp gì?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<{uri: string, base64?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("current");
  const [currentSessionId, setCurrentSessionId] = useState<string>(generateSessionId());
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null);

  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
      } catch (error) {
        console.error("Error requesting audio permissions:", error);
      }
    })();
  }, []);

  // Load chat sessions from database on component mount
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          SESSIONS_COLLECTION_ID,
          [
            // Filter by current user
            // Note: Appwrite uses different query syntax, adjust based on your schema
          ]
        );

        const sessions: ChatSession[] = response.documents.map((doc: any) => ({
          id: doc.sessionId,
          title: doc.topic,
          date: new Date(doc.startTime).toLocaleString("vi-VN"),
        }));

        setChatSessions(sessions);
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      }
    };

    loadChatSessions();
  }, [user?.$id]);

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      
      // Configure audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm");
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      console.log("Recording saved to:", uri);

      // Send to backend for transcription
      if (uri) {
        await transcribeAudio(uri);
      }

      recordingRef.current = null;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      setIsLoading(true);

      console.log("Audio URI:", audioUri);

      // Read file as Base64 using legacy FileSystem API
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: "base64",
      });

      console.log("Base64 audio size:", base64Audio.length);

      // Send as JSON with Base64 encoded audio
      const transcribeResponse = await fetch(API_ENDPOINTS.TRANSCRIBE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: "m4a",
        }),
      });

      console.log("Transcribe response status:", transcribeResponse.status);

      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        console.error("Transcribe error:", errorText);
        throw new Error("Transcription failed");
      }

      const data = await transcribeResponse.json();
      const transcribedText = data.text || data.transcription || "";

      if (transcribedText) {
        setInputMessage(prev => prev + (prev ? " " : "") + transcribedText);
        console.log("Transcribed text:", transcribedText);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      Alert.alert("Lỗi", "Không thể nhận diện giọng nói");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = async (messageContent: string) => {
    try {
      // Clean text: remove all emojis, markdown symbols, and extra whitespace
      let cleanedText = messageContent
        // Remove emojis
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F000}-\u{1F02F}]/gu, "")
        // Remove markdown bold/italic
        .replace(/[*_`]/g, "")
        // Remove bullet points and list markers at start of line
        .replace(/^[\s]*[•\-\*]\s+/gm, "")
        // Remove markdown headers
        .replace(/^#+\s+/gm, "")
        // Replace newlines with space (to treat as one continuous text)
        .replace(/\n/g, " ")
        // Remove extra whitespace at start/end
        .trim()
        // Replace multiple spaces with single space
        .replace(/\s+/g, " ");

      // Split by sentence endings for better reading
      const sentences = cleanedText.split(/([.!?])\s+/).filter(s => s.trim());
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i]?.trim();
        const punctuation = sentences[i + 1] || "";
        
        if (sentence) {
          await Speech.speak(sentence + (punctuation || ""), { 
            language: "vi",
            rate: 0.9,
          });
          
          // Add pause between sentences
          if (i + 2 < sentences.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
    } catch (error) {
      console.error("Error speaking message:", error);
      Alert.alert("Lỗi", "Không thể phát âm thanh");
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          base64: asset.base64 || undefined,
        });
        console.log("Image selected - URI:", asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh");
    }
  };

  const handleLikeMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, liked: !msg.liked, disliked: false }
          : msg
      )
    );
  };

  const handleDislikeMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, disliked: !msg.disliked, liked: false }
          : msg
      )
    );
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" && !selectedImage) return;

    console.log("handleSendMessage called, currentSessionId:", currentSessionId);
    console.log("User ID:", user?.$id);
    console.log("Selected image:", selectedImage);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      image: selectedImage?.uri,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    // Save new session if this is the first message
    if (chatSessions.length === 0 || !chatSessions.find(s => s.id === currentSessionId)) {
      const newSession: ChatSession = {
        id: currentSessionId,
        title: userMessage.content.substring(0, 50), // Use first 50 chars as title
        date: new Date().toLocaleString("vi-VN"),
      };
      setChatSessions(prev => [newSession, ...prev]);

      // Save to Appwrite database
      try {
        await databases.createDocument(
          DATABASE_ID,
          SESSIONS_COLLECTION_ID,
          currentSessionId,
          {
            sessionId: currentSessionId,
            userId: user?.$id || "unknown",
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            topic: userMessage.content.substring(0, 50),
          }
        );
      } catch (error) {
        console.error("Error saving session to database:", error);
      }
    }
    console.log('Sending message to bot API...');

    try {
      const requestBody: any = {
        user_id: user?.$id || "unknown",
        session_id: currentSessionId,
        message: userMessage.content,
      };

      // Add image if selected (send as Base64)
      if (selectedImage) {
        if (selectedImage.base64) {
          // Send only the base64 string (without data URI prefix)
          requestBody.image = selectedImage.base64;
        } else {
          // If base64 not available, send URI (backend needs to handle this)
          requestBody.image = selectedImage.uri;
        }
        console.log("Image added to request body");
      }

      console.log("Request body:", {
        ...requestBody,
        image: requestBody.image ? "Base64 image data..." : undefined,
      });

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Chat API Response received, status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to get response from bot");
      }

      // Create bot message that will be updated as we stream
      const botMessageId = (Date.now() + 1).toString();
      let fullResponse = "";
      let hasReceivedFirstChunk = false;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.warn("Response body is not readable, trying to parse as JSON");
        // Fallback: try to parse as JSON if body is not streamable
        try {
          const text = await response.text();
          console.log("Response text:", text);
          
          let botText = "";
          try {
            const data = JSON.parse(text);
            botText = data.response || data.text || JSON.stringify(data);
          } catch {
            // If not JSON, use text as-is
            botText = text || "No response from server";
          }
          
          setMessages(prev => [...prev, {
            id: botMessageId,
            type: "bot",
            content: botText,
            timestamp: new Date(),
          }]);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Cannot read response body");
        }
      } else {
        // Add initial empty bot message
        setMessages(prev => [...prev, {
          id: botMessageId,
          type: "bot",
          content: "",
          timestamp: new Date(),
        }]);

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          // Hide loading indicator after first chunk received
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsLoading(false);
          }

          // Update the bot message with accumulated content
          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        }

        // Final update to remove loading indicator
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      // Clear selected image after sending
      setSelectedImage(null);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Xin lỗi, có lỗi kết nối. Vui lòng thử lại!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Delete from database
      await databases.deleteDocument(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        sessionId
      );

      // Remove from UI
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was current, switch to new chat
      if (selectedSessionId === sessionId) {
        handleSelectSession("current");
      }

      console.log("Session deleted:", sessionId);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log("handleSelectSession called with:", sessionId);
    setSelectedSessionId(sessionId);
    setSidebarVisible(false);
    setSelectedImage(null);
    
    if (sessionId === "current") {
      // Create new session
      const newSessionId = generateSessionId();
      console.log("Creating new session:", newSessionId);
      setCurrentSessionId(newSessionId);
      setMessages([
        {
          id: "1",
          type: "bot",
          content: "Xin chào! 👋 Tôi là trợ lý sức khỏe của bạn. Tôi có thể giúp bạn:\n\n• Tư vấn về sức khỏe\n• Giải thích các chỉ số\n• Gợi ý lối sống lành mạnh\n\nBạn cần tôi giúp gì?",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Load existing session from backend
    try {
      setCurrentSessionId(sessionId);
      setIsLoading(true);

      console.log("Fetching history for session:", sessionId);
      const response = await fetch(API_ENDPOINTS.HISTORY(sessionId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mobile-Lifestyle-App",
        },
      });

      console.log("History API Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to load session history");
      }

      const data = await response.json();
      console.log("Loaded history data:", data);
      
      // Convert API response to Message format
      const loadedMessages: Message[] = data.history.map((msg: any, index: number) => ({
        id: `${sessionId}-${index}`,
        type: msg.role === "user" ? "user" : "bot",
        content: msg.message,
        timestamp: new Date(),
      }));

      console.log("Converted messages:", loadedMessages);
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading session history:", error);
      setMessages([
        {
          id: "1",
          type: "bot",
          content: "Xin lỗi, không thể tải lịch sử cuộc trò chuyện.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userMessage : styles.botMessage,
            ]}
          >
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.messageContentWrapper}>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                {item.content}
              </Text>
              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>

          {/* Action buttons - Like, Dislike, Voice (only for bot messages) */}
          {!isUser && (
            <View style={styles.messageActionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, item.liked && styles.actionButtonActive]}
                onPress={() => handleLikeMessage(item.id)}
              >
                <MaterialCommunityIcons
                  name={item.liked ? "thumb-up" : "thumb-up-outline"}
                  size={18}
                  color={item.liked ? "#007AFF" : "#999"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, item.disliked && styles.actionButtonActive]}
                onPress={() => handleDislikeMessage(item.id)}
              >
                <MaterialCommunityIcons
                  name={item.disliked ? "thumb-down" : "thumb-down-outline"}
                  size={18}
                  color={item.disliked ? "#FF3B30" : "#999"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSpeakMessage(item.content)}
              >
                <MaterialCommunityIcons
                  name="volume-high"
                  size={18}
                  color="#007AFF"
                />
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
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(!sidebarVisible)}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#007AFF" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="robot-happy" size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Health Bot</Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => handleSelectSession("current")}
          >
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
          inverted={false}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#007AFF" />
            <Text style={styles.loadingText}>Bot đang suy nghĩ...</Text>
          </View>
        )}

        {/* Input */}
        <View>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handlePickImage}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
            </TouchableOpacity>
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
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <MaterialCommunityIcons 
                name={isRecording ? "microphone-off" : "microphone"} 
                size={24} 
                color={isRecording ? "#FF3B30" : "#007AFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, (inputMessage.trim() === "" && !selectedImage) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading || (inputMessage.trim() === "" && !selectedImage) || isRecording}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={(isLoading || (inputMessage.trim() === "" && !selectedImage) || isRecording) ? "#ccc" : "#fff"}
              />
            </TouchableOpacity>
          </View>
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
              onPress={() => handleSelectSession("current")}
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
                    onPress={() => handleSelectSession(session.id)}
                  >
                    <MaterialCommunityIcons name="chat-outline" size={20} color="#666" />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionItemText} numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text style={styles.sessionDate}>{session.date}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteSession(session.id)}
                    style={styles.deleteSessionButton}
                  >
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#E3F2FD",
    borderBottomWidth: 0,
    gap: 12,
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  newChatButton: {
    padding: 8,
    marginRight: -8,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "flex-end",
    gap: 10,
  },
  userContainer: {
    justifyContent: "flex-end",
    marginLeft: "auto",
    marginRight: 0,
    width: "100%",
  },
  botContainer: {
    justifyContent: "flex-start",
    marginRight: "auto",
    marginLeft: 0,
    width: "100%",
  },
  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "60%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: "#b3b3b3",
    maxWidth: "70%",
    marginLeft: "auto",
  },
  botMessage: {
    backgroundColor: "#fff",
    borderWidth: 0,
    maxWidth: "100%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  userText: {
    color: "#000",
    fontSize: 15,
  },
  botText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  messageContentWrapper: {
    width: "100%",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "400",
    textAlign: "right",
  },
  userTimestamp: {
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "right",
  },
  botTimestamp: {
    color: "#999",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  loadingText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 0,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    color: "#333",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#ddd",
    shadowOpacity: 0,
    elevation: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  sidebarOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 99,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 224,
    backgroundColor: "#fff",
    zIndex: 101,
    flexDirection: "column",
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sessionsList: {
    flex: 1,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  activeSession: {
    backgroundColor: "#EBF5FF",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  sessionDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  deleteSessionButton: {
    padding: 6,
    marginRight: 4,
  },
  recordingButton: {
    backgroundColor: "#FFE5E5",
    borderWidth: 1.5,
    borderColor: "#FF3B30",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  removeImageButton: {
    padding: 4,
    marginLeft: "auto",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionButtonActive: {
    backgroundColor: "#e8f4ff",
    borderColor: "#007AFF",
  },
});
