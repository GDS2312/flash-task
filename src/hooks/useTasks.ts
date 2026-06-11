import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { loadTasks, saveTasks, updateTask, deleteTask } from '../store';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTasks(loadTasks());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setTasks(loadTasks());
  }, []);

  const addTask = useCallback((task: Task) => {
    const current = loadTasks();
    current.push(task);
    saveTasks(current);
    setTasks(current);
  }, []);

  const editTask = useCallback((id: string, updates: Partial<Task>) => {
    const result = updateTask(id, updates);
    if (result) {
      setTasks(prev => prev.map(t => t.id === id ? result : t));
    }
  }, []);

  const removeTask = useCallback((id: string) => {
    deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleStatus = useCallback((id: string) => {
    const current = loadTasks();
    const task = current.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated = updateTask(id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  }, []);

  const addTasks = useCallback((newTasks: Task[]) => {
    const current = loadTasks();
    current.push(...newTasks);
    saveTasks(current);
    setTasks(current);
  }, []);

  return { tasks, loading, refresh, addTask, editTask, removeTask, toggleStatus, addTasks };
}
