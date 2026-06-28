import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { transcribeAudio } from '@/lib/whisper';

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'error';

export function useVoiceRecorder(onTranscribed: (text: string) => void) {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission denied');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setState('recording');
    } catch (e) {
      setError('Could not start recording');
      setState('error');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setState('transcribing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (!uri) throw new Error('No audio URI');
      const text = await transcribeAudio(uri);
      setState('idle');
      if (text) onTranscribed(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed');
      setState('error');
    }
  }, [onTranscribed]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return { state, error, startRecording, stopRecording, reset };
}
