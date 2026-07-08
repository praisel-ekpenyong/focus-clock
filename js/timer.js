import { formatDateKey } from './format-date.js';
import { createTimerClock } from './timer-clock.js';
import { secondsToParts, formatClockParts } from './format-time.js';


const MODE_LABELS = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export class PomodoroTimer {
  constructor(settings, callbacks) {
    this.settings = settings;
    this.callbacks = callbacks;
    this.clock = createTimerClock(400);
    this.mode = 'focus';
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isCompleted = false;
    this.activeTaskId = null;
    this._syncFlags();
  }

  get isRunning() { return this.clock.isRunning; }
  get isPaused() { return this.clock.isPaused; }

  _syncFlags() {
    this.isRunning = this.clock.isRunning;
    this.isPaused = this.clock.isPaused;
  }

  getDurationForMode(mode) {
    const map = {
      focus: this.settings.focusMinutes,
      shortBreak: this.settings.shortBreakMinutes,
      longBreak: this.settings.longBreakMinutes,
    };
    return (map[mode] || 25) * 60;
  }

  setMode(mode, reset = true) {
    this.mode = mode;
    if (reset) {
      this.reset(false);
      this.totalSeconds = this.getDurationForMode(mode);
      this.remainingSeconds = this.totalSeconds;
      this.isCompleted = false;
    }
    this.callbacks.onUpdate();
  }

  setSettings(settings) {
    this.settings = settings;
    if (!this.isRunning && !this.isCompleted) {
      this.totalSeconds = this.getDurationForMode(this.mode);
      this.remainingSeconds = this.totalSeconds;
      this.callbacks.onUpdate();
    }
  }

  addMinutes(minutes) {
    if (this.isCompleted) {
      this.isCompleted = false;
      this.remainingSeconds = minutes * 60;
      this.totalSeconds = this.remainingSeconds;
    } else if (this.isRunning || this.isPaused) {
      this.remainingSeconds += minutes * 60;
      this.totalSeconds += minutes * 60;
    } else {
      this.remainingSeconds = this.getDurationForMode(this.mode) + minutes * 60;
      this.totalSeconds = this.remainingSeconds;
    }
    this.callbacks.onUpdate();
  }

  start() {
    if (this.isCompleted) return;
    if (this.remainingSeconds <= 0) {
      this.totalSeconds = this.getDurationForMode(this.mode);
      this.remainingSeconds = this.totalSeconds;
    }
    this.isCompleted = false;
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

  reset(updateTitle = true) {
    this.isCompleted = false;
    this.clock.resetClock();
    this._syncFlags();
    this.totalSeconds = this.getDurationForMode(this.mode);
    this.remainingSeconds = this.totalSeconds;
    if (updateTitle) this.callbacks.onUpdate();
  }

  complete() {
    this.isCompleted = true;
    this.remainingSeconds = 0;
    this.clock.pauseClock();
    this.clock.stopTick();
    this._syncFlags();
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

  getDisplayTime() {
    return secondsToParts(this.remainingSeconds);
  }

  getProgress() {
    if (!this.totalSeconds) return 0;
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  }

  getModeLabel() {
    return MODE_LABELS[this.mode];
  }

  formatTimeString() {
    const parts = this.getDisplayTime();
    return formatClockParts(parts, { showHours: parts.hours > 0 });
  }

  setActiveTask(taskId) {
    this.activeTaskId = taskId;
  }

  clearActiveTask() {
    this.activeTaskId = null;
  }

  recordSession(sessions) {
    const key = formatDateKey(new Date());
    sessions[key] = (sessions[key] || 0) + 1;
    return sessions;
  }

  stopTicking() {
    this.clock.stopTick();
  }

  destroy() {
    this.clock.destroy();
  }
}