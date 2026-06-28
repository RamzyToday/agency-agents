import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderSettings } from './types';
import { getDoFirstTasks } from './tasks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function buildDigestBody(label: string): Promise<string> {
  const tasks = await getDoFirstTasks();
  if (tasks.length === 0) return `${label} — no urgent tasks. You're clear!`;
  const lines = tasks.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}`);
  return `${label}\n${lines.join('\n')}`;
}

export async function scheduleReminders(settings: ReminderSettings): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (settings.morningEnabled) {
    const body = await buildDigestBody('Good morning! Your top tasks:');
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Focus — Morning Check-in', body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.morningHour,
        minute: settings.morningMinute,
      },
    });
  }

  if (settings.afternoonEnabled) {
    const body = await buildDigestBody('Afternoon check-in — still on these?');
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Focus — Afternoon Check-in', body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.afternoonHour,
        minute: settings.afternoonMinute,
      },
    });
  }
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
