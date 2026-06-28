import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/lib/types';
import { scheduleReminders, cancelReminders, requestPermissions } from '@/lib/notifications';
import {
  isNotionEnabled,
  syncAllTasks,
  getLastSyncTime,
} from '@/lib/notion-sync';
import { verifyNotionConnection } from '@/lib/notion';

const SETTINGS_KEY = 'focus:reminder-settings';

function fmt(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min} ${ampm}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [saved, setSaved] = useState(false);

  const [notionEnabled] = useState(isNotionEnabled());
  const [notionStatus, setNotionStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [notionDbName, setNotionDbName] = useState<string | null>(null);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getLastSyncTime().then(setLastSync);
      if (notionEnabled) checkNotionConnection();
    }, [notionEnabled])
  );

  const checkNotionConnection = async () => {
    const token = process.env.EXPO_PUBLIC_NOTION_TOKEN;
    const dbId = process.env.EXPO_PUBLIC_NOTION_DATABASE_ID;
    if (!token || !dbId) return;
    setNotionStatus('checking');
    try {
      const { name } = await verifyNotionConnection(token, dbId);
      setNotionDbName(name);
      setNotionStatus('ok');
      setNotionError(null);
    } catch (e) {
      setNotionStatus('error');
      setNotionError(e instanceof Error ? e.message : 'Connection failed');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    const { synced, failed } = await syncAllTasks();
    setSyncing(false);
    const freshSync = await getLastSyncTime();
    setLastSync(freshSync);
    if (failed > 0) {
      Alert.alert('Sync complete', `${synced} tasks synced, ${failed} failed. Check your Notion credentials.`);
    } else {
      Alert.alert('Sync complete', `${synced} task${synced !== 1 ? 's' : ''} pushed to Notion.`);
    }
  };

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

  const update = (patch: Partial<ReminderSettings>) => saveSettings({ ...settings, ...patch });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {saved && <Text style={styles.savedTag}>Saved</Text>}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Notion Sync ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>INTEGRATIONS</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitleIcon}>N</Text>
              <Text style={styles.cardTitle}>Notion</Text>
            </View>
            {notionEnabled ? (
              <View style={[styles.statusDot, notionStatus === 'ok' ? styles.dotGreen : notionStatus === 'error' ? styles.dotRed : styles.dotGray]} />
            ) : null}
          </View>

          {!notionEnabled ? (
            <View style={styles.notionSetup}>
              <Text style={styles.notionSetupText}>
                Add these two lines to your <Text style={styles.code}>.env</Text> file to enable automatic Notion sync:
              </Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeBlockText}>EXPO_PUBLIC_NOTION_TOKEN=secret_...</Text>
                <Text style={styles.codeBlockText}>EXPO_PUBLIC_NOTION_DATABASE_ID=...</Text>
              </View>
              <Text style={styles.notionSetupText}>
                Get your token at{' '}
                <Text style={styles.link}>notion.so/my-integrations</Text>
                . Create a database with Name, Status (select), Quadrant (select), Deadline (date), Effort (min) (number), Notes (rich_text), FocusID (rich_text) columns — then share it with your integration.
              </Text>
            </View>
          ) : (
            <>
              {notionStatus === 'checking' && (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.statusText}>Checking connection...</Text>
                </View>
              )}
              {notionStatus === 'ok' && (
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.statusText}>Connected to <Text style={styles.bold}>{notionDbName}</Text></Text>
                </View>
              )}
              {notionStatus === 'error' && (
                <View style={styles.statusRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.doFirst} />
                  <Text style={[styles.statusText, { color: Colors.doFirst }]}>{notionError}</Text>
                </View>
              )}

              {lastSync && (
                <Text style={styles.lastSync}>
                  Last sync: {format(parseISO(lastSync), 'MMM d, h:mm a')}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
                onPress={handleSyncAll}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="sync" size={15} color={Colors.white} />
                    <Text style={styles.syncBtnText}>Sync all tasks to Notion</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.syncNote}>
                New tasks sync automatically. Use this to push existing tasks on first setup.
              </Text>
            </>
          )}
        </View>

        {/* ── Reminders ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>REMINDERS</Text>
        </View>

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

        <View style={{ height: 40 }} />
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
  content: { padding: 16, gap: 10 },
  sectionLabel: { paddingHorizontal: 4, paddingTop: 6 },
  sectionText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitleIcon: {
    color: Colors.white,
    backgroundColor: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    width: 22,
    height: 22,
    borderRadius: 4,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: { backgroundColor: Colors.success },
  dotRed: { backgroundColor: Colors.doFirst },
  dotGray: { backgroundColor: Colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: Colors.textSecondary, fontSize: 14 },
  bold: { fontWeight: '600', color: Colors.text },
  lastSync: { color: Colors.textMuted, fontSize: 12 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  syncNote: { color: Colors.textMuted, fontSize: 12 },
  notionSetup: { gap: 10 },
  notionSetupText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  code: { color: Colors.primary, fontFamily: 'monospace' },
  codeBlock: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  codeBlockText: { color: Colors.text, fontSize: 12, fontFamily: 'monospace' },
  link: { color: Colors.primary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingLeft: 4 },
  previewTime: { color: Colors.primary, fontSize: 16, fontWeight: '700', marginLeft: 'auto' },
  note: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
});
