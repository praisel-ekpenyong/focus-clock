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

  it('defaults tzScrubOffsetMs when missing', () => {
    expect(normalizeState({}).tzScrubOffsetMs).toBe(0);
  });
});