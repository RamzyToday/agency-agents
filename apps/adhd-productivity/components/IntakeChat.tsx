import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { IntakeMessage, ExtractedTask } from '@/lib/types';
import { QUADRANT_META } from '@/constants/quadrants';

interface Props {
  messages: IntakeMessage[];
  state: 'thinking' | 'active' | 'saving' | 'done' | 'error';
  extractedTask: ExtractedTask | null;
  error: string | null;
  onReply: (text: string) => void;
}

export function IntakeChat({ messages, state, extractedTask, error, onReply }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, state]);

  const submit = () => {
    const text = input.trim();
    if (!text || state !== 'active') return;
    setInput('');
    onReply(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {state === 'thinking' && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {state === 'done' && extractedTask && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>
              {QUADRANT_META[extractedTask.quadrant].icon}
            </Text>
            <Text style={styles.confirmTitle}>{extractedTask.title}</Text>
            <Text style={[styles.confirmQuadrant, { color: QUADRANT_META[extractedTask.quadrant].color }]}>
              {QUADRANT_META[extractedTask.quadrant].label}
            </Text>
            <Text style={styles.confirmSaved}>Saved to your tasks</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBubble}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {state === 'active' && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Reply..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={submit}
            returnKeyType="send"
            autoFocus
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={submit}
            disabled={!input.trim()}
          >
            <Ionicons name="arrow-up" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: Colors.surfaceElevated,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  aiText: {
    color: Colors.text,
  },
  userText: {
    color: Colors.white,
  },
  confirmCard: {
    backgroundColor: Colors.successMuted,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  confirmEmoji: {
    fontSize: 28,
  },
  confirmTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmQuadrant: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmSaved: {
    color: Colors.success,
    fontSize: 13,
    marginTop: 2,
  },
  errorBubble: {
    backgroundColor: Colors.doFirstMuted,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: Colors.doFirst,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
