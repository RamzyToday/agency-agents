import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, addMinutes, setHours, setMinutes, startOfTomorrow } from 'date-fns';
import { Colors } from '@/constants/colors';
import { ExtractedTask } from '@/lib/types';
import { createCalendarEvent } from '@/lib/google-calendar';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

interface Props {
  visible: boolean;
  task: ExtractedTask | null;
  onClose: () => void;
  onScheduled: (eventId: string) => void;
}

type SheetState = 'picking' | 'signing-in' | 'creating' | 'done' | 'error';

export function CalendarBlockSheet({ visible, task, onClose, onScheduled }: Props) {
  const translateY = useRef(new Animated.Value(600)).current;
  const { signIn, isReady } = useGoogleCalendar();

  const tomorrow8am = setMinutes(setHours(startOfTomorrow(), 9), 0);
  const [date, setDate] = useState(tomorrow8am);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(task?.effortMinutes ?? 30);
  const [sheetState, setSheetState] = useState<SheetState>('picking');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when sheet opens for a new task
  useEffect(() => {
    if (visible) {
      setDate(tomorrow8am);
      setDuration(task?.effortMinutes ?? 30);
      setSheetState('picking');
      setErrorMsg('');
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      Animated.timing(translateY, { toValue: 600, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, task]);

  const handleSchedule = async () => {
    if (!task) return;
    setSheetState('signing-in');
    try {
      const token = await signIn();
      if (!token) {
        setErrorMsg('Sign-in was cancelled or failed. Try again.');
        setSheetState('error');
        return;
      }
      setSheetState('creating');
      const event = await createCalendarEvent(token, {
        title: task.title,
        startDateTime: date,
        durationMinutes: duration,
        notes: task.notes,
      });
      setSheetState('done');
      setTimeout(() => {
        onScheduled(event.id);
        onClose();
      }, 1400);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Could not create event');
      setSheetState('error');
    }
  };

  const closestDuration = DURATION_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Block time for this?</Text>
            <Text style={styles.taskName} numberOfLines={2}>{task?.title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {sheetState === 'done' ? (
          <View style={styles.doneState}>
            <Text style={styles.doneEmoji}>📅</Text>
            <Text style={styles.doneText}>Blocked on your calendar</Text>
            <Text style={styles.doneSubtext}>
              {format(date, 'EEE, MMM d')} at {format(date, 'h:mm a')} · {duration}m
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Date row */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <TouchableOpacity
                style={styles.rowValue}
                onPress={() => { setShowDatePicker(true); setShowTimePicker(false); }}
              >
                <Text style={styles.rowValueText}>{format(date, 'EEE, MMM d')}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Time row */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Time</Text>
              <TouchableOpacity
                style={styles.rowValue}
                onPress={() => { setShowTimePicker(true); setShowDatePicker(false); }}
              >
                <Text style={styles.rowValueText}>{format(date, 'h:mm a')}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Date/Time pickers (inline on iOS, dialog on Android) */}
            {(showDatePicker || showTimePicker) && (
              <DateTimePicker
                value={date}
                mode={showDatePicker ? 'date' : 'time'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                  if (selected) setDate(selected);
                }}
                style={{ backgroundColor: Colors.surfaceElevated }}
              />
            )}

            {/* Duration */}
            <View style={styles.durationSection}>
              <Text style={styles.rowLabel}>Duration</Text>
              <View style={styles.durationChips}>
                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, duration === opt && styles.chipActive]}
                    onPress={() => setDuration(opt)}
                  >
                    <Text style={[styles.chipText, duration === opt && styles.chipTextActive]}>
                      {opt < 60 ? `${opt}m` : `${opt / 60}h`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.endTime}>
                Ends at {format(addMinutes(date, duration), 'h:mm a')}
              </Text>
            </View>

            {sheetState === 'error' && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.cta, (sheetState === 'signing-in' || sheetState === 'creating') && styles.ctaDisabled]}
              onPress={handleSchedule}
              disabled={sheetState === 'signing-in' || sheetState === 'creating'}
            >
              {sheetState === 'signing-in' || sheetState === 'creating' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="calendar" size={18} color={Colors.white} />
                  <Text style={styles.ctaText}>
                    {sheetState === 'error' ? 'Try Again' : 'Add to Google Calendar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              {sheetState === 'signing-in'
                ? 'Opening Google sign-in...'
                : "You'll approve Google access once, then it's instant."}
            </Text>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  title: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  taskName: { color: Colors.text, fontSize: 16, fontWeight: '600', maxWidth: 260 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { color: Colors.text, fontSize: 15 },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValueText: { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  durationSection: { paddingTop: 16, gap: 12 },
  durationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: Colors.primary },
  endTime: { color: Colors.textMuted, fontSize: 12 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.schedule,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  hint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 },
  errorText: { color: Colors.doFirst, fontSize: 13, marginTop: 8 },
  doneState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  doneEmoji: { fontSize: 40 },
  doneText: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  doneSubtext: { color: Colors.textSecondary, fontSize: 14 },
});
