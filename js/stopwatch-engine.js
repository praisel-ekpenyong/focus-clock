import { createTimerClock } from './timer-clock.js';
import { msToParts } from './format-time.js';

export class Stopwatch {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.clock = createTimerClock(10);
    this.laps = [];
    this._syncFlags();
  }

  get isRunning() { return this.clock.isRunning; }
  get isPaused() { return this.clock.isPaused; }
  get startedAt() { return this.clock.startedAt; }

  _syncFlags() {
    this.isRunning = this.clock.isRunning;
    this.isPaused = this.clock.isPaused;
  }

  start() {
    if (this.isRunning) return;
    this.clock.resumeClock();
    this._syncFlags();
    this.clock.startTick(() => this.tick());
    this.callbacks.onUpdate();
  }

  pause() {
    this.clock.pauseClock();
    this._syncFlags();
    this.callbacks.onUpdate();
  }

  reset() {
    this.laps = [];
    this.clock.resetClock();
    this._syncFlags();
    this.callbacks.onUpdate();
  }

  lap() {
    if (!this.clock.startedAt) return;
    const overall = this.getElapsedMs();
    const prevOverall = this.laps.length
      ? this.laps[this.laps.length - 1].overallMs
      : 0;
    this.laps.push({
      id: Date.now().toString(),
      lapMs: overall - prevOverall,
      overallMs: overall,
    });
    this.callbacks.onUpdate();
  }

  tick() {
    if (!this.clock.isRunning) return;
    this.clock.elapsedSnapshot = this.clock.getElapsedMs();
    this.callbacks.onUpdate();
  }

  getElapsedMs() {
    return this.clock.getElapsedMs();
  }

  msToParts(ms) {
    return msToParts(ms);
  }

  destroy() {
    this.clock.destroy();
  }
}