export class CountdownTimer {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    this.tickInterval = null;
    this.label = '';
  }

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
    this.isRunning = true;
    this.isPaused = false;
    this.isCompleted = false;
    if (!this.startedAt) this.startedAt = Date.now();
    if (this.pausedAt) {
      this.accumulatedPause += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
    this.tickInterval = setInterval(() => this.tick(), 400);
    this.callbacks.onUpdate();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.isPaused = true;
    this.pausedAt = Date.now();
    clearInterval(this.tickInterval);
    this.callbacks.onUpdate();
  }

  reset(update = true) {
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    clearInterval(this.tickInterval);
    if (update) {
      this.remainingSeconds = this.totalSeconds;
      this.callbacks.onUpdate();
    }
  }

  complete() {
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = true;
    this.remainingSeconds = 0;
    clearInterval(this.tickInterval);
    this.callbacks.onComplete();
    this.callbacks.onUpdate();
  }

  tick() {
    if (!this.isRunning) return;
    const elapsed = Math.floor((Date.now() - this.startedAt - this.accumulatedPause) / 1000);
    this.remainingSeconds = Math.max(0, this.totalSeconds - elapsed);
    if (this.remainingSeconds <= 0) {
      this.complete();
      return;
    }
    this.callbacks.onUpdate();
  }

  getDisplay() {
    const s = this.remainingSeconds;
    return {
      hours: Math.floor(s / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  }

  getElapsed() {
    const elapsed = this.totalSeconds - this.remainingSeconds;
    return {
      hours: Math.floor(elapsed / 3600),
      minutes: Math.floor((elapsed % 3600) / 60),
      seconds: elapsed % 60,
    };
  }

  getProgress() {
    if (!this.totalSeconds) return 0;
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  }

  destroy() {
    clearInterval(this.tickInterval);
  }
}