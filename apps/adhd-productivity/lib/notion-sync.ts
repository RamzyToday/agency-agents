import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './types';
import { createNotionPage, updateNotionPage } from './notion';
import { updateTask, loadTasks } from './tasks';

const LAST_SYNC_KEY = 'focus:notion-last-sync';

function getCredentials(): { token: string; databaseId: string } | null {
  const token = process.env.EXPO_PUBLIC_NOTION_TOKEN;
  const databaseId = process.env.EXPO_PUBLIC_NOTION_DATABASE_ID;
  if (!token || !databaseId) return null;
  return { token, databaseId };
}

export function isNotionEnabled(): boolean {
  return !!getCredentials();
}

export async function syncNewTask(task: Task): Promise<void> {
  const creds = getCredentials();
  if (!creds) return;
  try {
    const pageId = await createNotionPage(creds.token, creds.databaseId, task);
    await updateTask(task.id, { notionPageId: pageId });
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('[Notion] syncNewTask failed:', e);
  }
}

export async function syncTaskCompletion(task: Task): Promise<void> {
  const creds = getCredentials();
  if (!creds || !task.notionPageId) return;
  try {
    await updateNotionPage(creds.token, task.notionPageId, { isCompleted: true });
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('[Notion] syncTaskCompletion failed:', e);
  }
}

export async function syncAllTasks(): Promise<{ synced: number; failed: number }> {
  const creds = getCredentials();
  if (!creds) return { synced: 0, failed: 0 };

  const tasks = await loadTasks();
  const unsynced = tasks.filter((t) => !t.notionPageId && !t.isCompleted);

  let synced = 0;
  let failed = 0;

  for (const task of unsynced) {
    try {
      const pageId = await createNotionPage(creds.token, creds.databaseId, task);
      await updateTask(task.id, { notionPageId: pageId });
      synced++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  return { synced, failed };
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}
