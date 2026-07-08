import { describe, it, expect } from 'vitest';
import {
  isValidTimezone,
  formatTimeParts,
  getHourInZone,
} from '../js/timezone-utils.js';

describe('timezone-utils', () => {
  it('accepts known IANA zones', () => {
    expect(isValidTimezone('America/Edmonton')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
  });

  it('rejects invalid zone ids', () => {
    expect(isValidTimezone('Not/A_Zone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });

  it('returns safe fallback for invalid zones', () => {
    const parts = formatTimeParts('Not/A_Zone');
    expect(parts.hour).toBe('--');
    expect(parts.minute).toBe('--');
  });

  it('returns numeric hour for valid zones', () => {
    const hour = getHourInZone('UTC', new Date('2026-07-08T12:00:00Z'));
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThan(24);
  });
});