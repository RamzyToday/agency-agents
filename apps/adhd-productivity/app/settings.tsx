import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/lib/types';
import { scheduleReminders, cancelReminders, requestPermissions } from '@/lib/notifications';

const SETTINGS_KEY = 'focus:reminder-settings';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function fmt(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min} ${ampm}`;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const saveSettings = async (next: ReminderSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permissions needed', 'Enable notifications in Settings to receive reminders.');
      return;
    }

    if (next.morningEnabled || next.afternoonEnabled) {
      await scheduleReminders(next);
    } else {
      await cancelReminders();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (patch: Partial<ReminderSettings>) => {
    const next = { ...settings, ...patch };
    saveSettings(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {saved && <Text style={styles.savedTag}>Saved</Text>}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Morning reminder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Morning Check-in</Text>
            <Switch
              value={settings.morningEnabled}
              onValueChange={(v) => update({ morningEnabled: v })}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          {settings.morningEnabled && (
            <View style={styles.timeRow}>
              <TimeSelector
                label="Hour"
                value={settings.morningHour}
                options={HOUR_OPTIONS}
                format={(h) => h.toString().padStart(2, '0')}
                onChange={(v) => update({ morningHour: v })}
              />
              <TimeSelector
                label="Minute"
                value={settings.morningMinute}
                options={MINUTE_OPTIONS}
                format={(m) => m.toString().padStart(2, '0')}
                onChange={(v) => update({ morningMinute: v })}
              />
              <Text style={styles.previewTime}>{fmt(settings.morningHour, settings.morningMinute)}</Text>
            </View>
          )}
        </View>

        {/* Afternoon reminder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Afternoon Check-in</Text>
            <Switch
              value={settings.afternoonEnabled}
              onValueChange={(v) => update({ afternoonEnabled: v })}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          {settings.afternoonEnabled && (
            <View style={styles.timeRow}>
              <TimeSelector
                label="Hour"
                value={settings.afternoonHour}
                options={HOUR_OPTIONS}
                format={(h) => h.toString().padStart(2, '0')}
                onChange={(v) => update({ afternoonHour: v })}
              />
              <TimeSelector
                label="Minute"
                value={settings.afternoonMinute}
                options={MINUTE_OPTIONS}
                format={(m) => m.toString().padStart(2, '0')}
                onChange={(v) => update({ afternoonMinute: v })}
              />
              <Text style={styles.previewTime}>{fmt(settings.afternoonHour, settings.afternoonMinute)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.note}>
          Reminders show your top 3 Do First tasks. Changes save automatically.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimeSelector({
  label,
  value,
  options,
  format: fmt2,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const idx = options.indexOf(value);
  const prev = () => onChange(options[(idx - 1 + options.length) % options.length]);
  const next = () => onChange(options[(idx + 1) % options.length]);

  return (
    <View style={ts.picker}>
      <Text style={ts.label}>{label}</Text>
      <View style={ts.row}>
        <TouchableOpacity onPress={prev} hitSlop={10}><Text style={ts.arrow}>‹</Text></TouchableOpacity>
        <Text style={ts.value}>{fmt2(value)}</Text>
        <TouchableOpacity onPress={next} hitSlop={10}><Text style={ts.arrow}>›</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const ts = StyleSheet.create({
  picker: { alignItems: 'center', gap: 4 },
  label: { color: Colors.textMuted, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arrow: { color: Colors.primary, fontSize: 22, fontWeight: '300' },
  value: { color: Colors.text, fontSize: 20, fontWeight: '600', minWidth: 28, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  savedTag: { color: Colors.success, fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingLeft: 4 },
  previewTime: { color: Colors.primary, fontSize: 16, fontWeight: '700', marginLeft: 'auto' },
  note: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
