import { formatDateKey, generateId } from './storage.js';

export function getTasksForDate(tasks, date) {
  const key = formatDateKey(date);
  return tasks
    .filter((t) => t.date === key)
    .sort((a, b) => a.position - b.position);
}

export function getPendingTasks(tasks, date) {
  return getTasksForDate(tasks, date).filter((t) => !t.completed);
}

export function getCompletedTasks(tasks, date) {
  return getTasksForDate(tasks, date).filter((t) => t.completed);
}

export function addTask(tasks, title, date, extra = {}) {
  const key = formatDateKey(date);
  const dayTasks = getTasksForDate(tasks, date);
  const maxPos = dayTasks.reduce((max, t) => Math.max(max, t.position), -1);
  const task = {
    id: generateId(),
    title: title.trim(),
    date: key,
    position: maxPos + 1,
    completed: false,
    createdAt: Date.now(),
    ...extra,
  };
  return [...tasks, task];
}

export function updateTask(tasks, id, updates) {
  return tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
}

export function deleteTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

export function toggleTaskComplete(tasks, id) {
  return tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : Date.now() } : t
  );
}

export function reorderTasks(tasks, id, newPosition, date) {
  const key = formatDateKey(date);
  const dayTasks = getTasksForDate(tasks, date);
  const task = dayTasks.find((t) => t.id === id);
  if (!task) return tasks;

  const others = dayTasks.filter((t) => t.id !== id);
  others.splice(newPosition, 0, task);
  const reordered = others.map((t, i) => ({ ...t, position: i }));

  return tasks.map((t) => {
    const updated = reordered.find((r) => r.id === t.id);
    return updated || t;
  });
}

export function findTask(tasks, id) {
  return tasks.find((t) => t.id === id);
}