import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, ExtractedTask } from './types';

const TASKS_KEY = 'focus:tasks';

export async function loadTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function createTask(extracted: ExtractedTask): Promise<Task> {
  const tasks = await loadTasks();
  const task: Task = {
    ...extracted,
    id: Date.now().toString(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  await saveTasks([...tasks, task]);
  return task;
}

export async function completeTask(id: string): Promise<void> {
  const tasks = await loadTasks();
  await saveTasks(
    tasks.map((t) =>
      t.id === id ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
    )
  );
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await loadTasks();
  await saveTasks(tasks.filter((t) => t.id !== id));
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const tasks = await loadTasks();
  await saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
}

export async function getActiveTasks(): Promise<Task[]> {
  const tasks = await loadTasks();
  return tasks.filter((t) => !t.isCompleted);
}

export async function getDoFirstTasks(): Promise<Task[]> {
  const tasks = await getActiveTasks();
  return tasks.filter((t) => t.quadrant === 'do-first').slice(0, 3);
}
