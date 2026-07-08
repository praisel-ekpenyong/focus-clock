import { describe, it, expect } from 'vitest';
import { normalizeState } from '../js/storage.js';

describe('normalizeState', () => {
  it('coerces invalid task list to empty array', () => {
    const state = normalizeState({ tasks: 'broken' });
    expect(state.tasks).toEqual([]);
  });

  it('clamps focus minutes to valid range', () => {
    const state = normalizeState({ settings: { focusMinutes: 999 } });
    expect(state.settings.focusMinutes).toBe(180);
  });

  it('preserves hour format as 12 or 24 only', () => {
    expect(normalizeState({ settings: { hourFormat: 24 } }).settings.hourFormat).toBe(24);
    expect(normalizeState({ settings: { hourFormat: 99 } }).settings.hourFormat).toBe(12);
  });

  it('filters invalid routine and task entries', () => {
    const state = normalizeState({
      routines: [null, { id: 'r1', title: 'OK', frequency: 'daily' }, { bad: true }],
      tasks: [null, { id: 't1', title: 'Task', date: '2026-07-08', position: 0, completed: false }],
    });
    expect(state.routines).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
  });

  it('defaults tzScrubOffsetMs when missing', () => {
    expect(normalizeState({}).tzScrubOffsetMs).toBe(0);
  });
});