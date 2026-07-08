import { createTimerClock } from './timer-clock.js';
import { secondsToParts } from './format-time.js';

export class CountdownTimer {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.clock = createTimerClock(400);
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isCompleted = false;
    this.label = '';
  }

  get isRunning() { return this.clock.isRunning; }
  get isPaused() { return this.clock.isPaused; }

  setDuration(hours, minutes, seconds, label = '') {
    this.reset(false);
    this.totalSeconds = hours * 3600 + minutes * 60 + seconds;
    this.remainingSeconds = this.totalSeconds;
    this.label = label;
    this.callbacks.onUpdate();
  }

  addMinutes(minutes) {
    if (this.isCompleted) {
      this.isCompleted = false;
      this.remainingSeconds = minutes * 60;
      this.totalSeconds = this.remainingSeconds;
    } else {
      this.remainingSeconds += minutes * 60;
      this.totalSeconds += minutes * 60;
    }
    this.callbacks.onUpdate();
  }

  start() {
    if (this.isCompleted || this.remainingSeconds <= 0) return;
    this.isCompleted = false;
    this.clock.resumeClock();
    this.clock.startTick(() => this.tick());
    this.callbacks.onUpdate();
  }

  pause() {
    this.clock.pauseClock();
    this.callbacks.onUpdate();
  }

  reset(update = true) {
    this.isCompleted = false;
    this.clock.resetClock();
    if (update) {
      this.remainingSeconds = this.totalSeconds;
      this.callbacks.onUpdate();
    }
  }

  complete() {
    this.isCompleted = true;
    this.remainingSeconds = 0;
    this.clock.pauseClock();
    this.clock.stopTick();
    this.callbacks.onComplete();
    this.callbacks.onUpdate();
  }

  tick() {
    if (!this.clock.isRunning) return;
    const elapsed = this.clock.getElapsedSeconds();
    this.remainingSeconds = Math.max(0, this.totalSeconds - elapsed);
    if (this.remainingSeconds <= 0) {
      this.complete();
      return;
    }
    this.callbacks.onUpdate();
  }

  getDisplay() {
    return secondsToParts(this.remainingSeconds);
  }

  getElapsed() {
    return secondsToParts(this.totalSeconds - this.remainingSeconds);
  }

  getProgress() {
    if (!this.totalSeconds) return 0;
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  }

  destroy() {
    this.clock.destroy();
  }
}