import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/lib/types';
import { loadTasks, completeTask, deleteTask } from '@/lib/tasks';
import { syncTaskCompletion } from '@/lib/notion-sync';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadTasks();
      setTasks(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markComplete = useCallback(
    async (id: string) => {
      const task = await completeTask(id);
      if (task) syncTaskCompletion(task);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await refresh();
    },
    [refresh]
  );

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return { tasks, activeTasks, completedTasks, loading, refresh, markComplete, remove };
}
