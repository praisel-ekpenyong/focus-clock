import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimerClock } from '../public/js/timer-clock.js';

describe('createTimerClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at zero elapsed time', () => {
    const clock = createTimerClock();
    expect(clock.getElapsedMs()).toBe(0);
  });

  it('tracks elapsed time while running', () => {
    const clock = createTimerClock();
    clock.resumeClock();
    vi.advanceTimersByTime(5000);
    expect(clock.getElapsedMs()).toBe(5000);
  });

  it('pauses without counting pause duration', () => {
    const clock = createTimerClock();
    clock.resumeClock();
    vi.advanceTimersByTime(3000);
    clock.pauseClock();
    vi.advanceTimersByTime(2000);
    expect(clock.getElapsedMs()).toBe(3000);
    clock.resumeClock();
    vi.advanceTimersByTime(1000);
    expect(clock.getElapsedMs()).toBe(4000);
  });

  it('resets to zero', () => {
    const clock = createTimerClock();
    clock.resumeClock();
    vi.advanceTimersByTime(1000);
    clock.resetClock();
    expect(clock.getElapsedMs()).toBe(0);
    expect(clock.isRunning).toBe(false);
  });
});