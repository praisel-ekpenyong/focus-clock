import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyRoutines } from '../js/routines.js';

describe('applyRoutines', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 8, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a daily routine task once per day', () => {
    const state = {
      routines: [{ id: 'r1', title: 'Morning standup', frequency: 'daily' }],
      tasks: [],
    };
    expect(applyRoutines(state)).toBe(true);
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].title).toBe('Morning standup');
    expect(applyRoutines(state)).toBe(false);
  });

  it('skips weekly routines on the wrong weekday', () => {
    const state = {
      routines: [{ id: 'r2', title: 'Monday only', frequency: 'weekly', weekday: 1 }],
      tasks: [],
    };
    expect(applyRoutines(state)).toBe(false);
    expect(state.tasks).toHaveLength(0);
  });
});