import { describe, it, expect } from 'vitest';
import { parseRoutePath } from '../public/js/url-state.js';

describe('parseRoutePath', () => {
  it('defaults to pomodoro when hash is empty', () => {
    expect(parseRoutePath('')).toBe('/pomodoro');
  });

  it('strips query string from route path', () => {
    expect(parseRoutePath('#/timezones?d=America/New_York&h=12')).toBe('/timezones');
  });

  it('adds leading slash when path omits it', () => {
    expect(parseRoutePath('#timer')).toBe('/timer');
  });
});