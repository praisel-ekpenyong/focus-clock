import { describe, it, expect } from 'vitest';
import {
  addTask,
  getPendingTasks,
  toggleTaskComplete,
  deleteTask,
} from '../js/tasks.js';

describe('tasks', () => {
  const date = new Date(2026, 6, 8);

  it('adds a task for a given date', () => {
    const tasks = addTask([], 'Write tests', date);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Write tests');
    expect(tasks[0].date).toBe('2026-07-08');
    expect(tasks[0].completed).toBe(false);
  });

  it('filters pending tasks by date', () => {
    let tasks = addTask([], 'A', date);
    tasks = addTask(tasks, 'B', date);
    tasks = toggleTaskComplete(tasks, tasks[0].id);
    const pending = getPendingTasks(tasks, date);
    expect(pending).toHaveLength(1);
    expect(pending[0].title).toBe('B');
  });

  it('deletes a task by id', () => {
    const tasks = addTask([], 'Remove me', date);
    const id = tasks[0].id;
    const next = deleteTask(tasks, id);
    expect(next).toHaveLength(0);
  });
});