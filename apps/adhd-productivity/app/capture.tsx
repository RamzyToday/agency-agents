import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { IntakeChat } from '@/components/IntakeChat';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useIntake } from '@/hooks/useIntake';

type CaptureMode = 'idle' | 'intake';

export default function CaptureScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [textInput, setTextInput] = useState('');

  const intake = useIntake(() => {
    setTimeout(() => {
      router.replace('/');
    }, 1800);
  });

  const voice = useVoiceRecorder((transcribed) => {
    setMode('intake');
    intake.begin(transcribed);
  });

  const submitText = () => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');
    setMode('intake');
    intake.begin(text);
  };

  const reset = () => {
    setMode('idle');
    setTextInput('');
    intake.reset();
    voice.reset();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {mode === 'intake' ? (
            <TouchableOpacity onPress={reset} style={styles.backBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={styles.headerTitle}>
            {mode === 'idle' ? 'Capture' : 'Intake'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {mode === 'idle' && (
          <View style={styles.idleContainer}>
            <Text style={styles.idlePrompt}>What's on your mind?</Text>
            <Text style={styles.idleSub}>Speak or type — I'll help you prioritize it.</Text>

            {/* Voice capture */}
            <View style={styles.voiceArea}>
              <VoiceRecorder
                state={voice.state}
                onStart={voice.startRecording}
                onStop={voice.stopRecording}
              />
              {voice.error && (
                <Text style={styles.voiceError}>{voice.error}</Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or type it</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Text input */}
            <View style={styles.textRow}>
              <TextInput
                style={styles.textInput}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="e.g. Call the accountant about taxes..."
                placeholderTextColor={Colors.textMuted}
                multiline
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={submitText}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !textInput.trim() && styles.sendBtnDisabled]}
                onPress={submitText}
                disabled={!textInput.trim()}
              >
                <Ionicons name="arrow-up" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === 'intake' && (
          <IntakeChat
            messages={intake.messages}
            state={intake.state as any}
            extractedTask={intake.extractedTask}
            error={intake.error}
            onReply={intake.reply}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  idleContainer: {
    flex: 1,
    padding: 24,
    gap: 28,
    justifyContent: 'center',
  },
  idlePrompt: { color: Colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  idleSub: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: -16 },
  voiceArea: { alignItems: 'center', gap: 12 },
  voiceError: { color: Colors.doFirst, fontSize: 13, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
