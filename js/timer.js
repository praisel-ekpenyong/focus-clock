import { formatDateKey } from './storage.js';

const MODE_LABELS = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export class PomodoroTimer {
  constructor(settings, callbacks) {
    this.settings = settings;
    this.callbacks = callbacks;
    this.mode = 'focus';
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    this.tickInterval = null;
    this.activeTaskId = null;
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
    this.isRunning = true;
    this.isPaused = false;
    this.isCompleted = false;
    if (!this.startedAt) this.startedAt = Date.now();
    if (this.pausedAt) {
      this.accumulatedPause += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
    this.startTicking();
    this.callbacks.onUpdate();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.isPaused = true;
    this.pausedAt = Date.now();
    this.stopTicking();
    this.callbacks.onUpdate();
  }

  reset(updateTitle = true) {
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    this.stopTicking();
    this.totalSeconds = this.getDurationForMode(this.mode);
    this.remainingSeconds = this.totalSeconds;
    if (updateTitle) this.callbacks.onUpdate();
  }

  complete() {
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = true;
    this.remainingSeconds = 0;
    this.stopTicking();
    this.callbacks.onComplete();
    this.callbacks.onUpdate();
  }

  startTicking() {
    this.stopTicking();
    this.tickInterval = setInterval(() => this.tick(), 400);
  }

  stopTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
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

  getDisplayTime() {
    const secs = this.remainingSeconds;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return { hours: h, minutes: m, seconds: s };
  }

  getProgress() {
    if (!this.totalSeconds) return 0;
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  }

  getModeLabel() {
    return MODE_LABELS[this.mode];
  }

  formatTimeString() {
    const { hours, minutes, seconds } = this.getDisplayTime();
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
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
}