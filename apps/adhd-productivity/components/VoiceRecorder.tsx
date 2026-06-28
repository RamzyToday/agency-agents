import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'error';

interface Props {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceRecorder({ state, onStart, onStop }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [state, pulse]);

  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, isRecording && styles.ringActive, { transform: [{ scale: pulse }] }]} />
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonActive]}
        onPress={isRecording ? onStop : onStart}
        disabled={isTranscribing}
        activeOpacity={0.8}
      >
        {isTranscribing ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={28}
            color={Colors.white}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.label}>
        {isTranscribing ? 'Transcribing...' : isRecording ? 'Tap to stop' : 'Tap to speak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  ring: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'transparent',
    top: -8,
  },
  ringActive: {
    borderColor: Colors.doFirst + '60',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: Colors.doFirst,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
