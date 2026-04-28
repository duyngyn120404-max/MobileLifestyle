import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { apiClient } from '@/src/config/apiClient';
import { cleanTextForSpeech } from '@/src/utils/formatting';

export const audioService = {
  async requestPermissions(): Promise<void> {
    await Audio.requestPermissionsAsync();
  },

  async startRecording(): Promise<Audio.Recording> {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    return recording;
  },

  async stopRecording(recording: Audio.Recording): Promise<string | null> {
    await recording.stopAndUnloadAsync();
    return recording.getURI();
  },

  async transcribe(audioUri: string): Promise<string> {
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: 'base64' });
    const data = await apiClient.transcribe(base64Audio, 'm4a');
    return data.text || data.transcription || '';
  },

  async speak(content: string): Promise<void> {
    const cleanedText = cleanTextForSpeech(content);
    const sentences = cleanedText.split(/([.!?])\s+/).filter(s => s.trim());

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]?.trim();
      const punctuation = sentences[i + 1] || '';
      if (sentence) {
        await Speech.speak(sentence + punctuation, { language: 'vi', rate: 0.9 });
        if (i + 2 < sentences.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  },
};
