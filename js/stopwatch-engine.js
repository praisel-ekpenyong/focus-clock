export class Stopwatch {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.isRunning = false;
    this.isPaused = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    this.tickInterval = null;
    this.laps = [];
    this.elapsed = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    if (!this.startedAt) this.startedAt = Date.now();
    if (this.pausedAt) {
      this.accumulatedPause += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
    this.tickInterval = setInterval(() => this.tick(), 10);
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

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.accumulatedPause = 0;
    this.elapsed = 0;
    this.laps = [];
    clearInterval(this.tickInterval);
    this.callbacks.onUpdate();
  }

  lap() {
    if (!this.startedAt) return;
    const overall = this.getElapsedMs();
    const prevOverall = this.laps.length
      ? this.laps[this.laps.length - 1].overallMs
      : 0;
    const lapMs = overall - prevOverall;
    this.laps.push({
      id: Date.now().toString(),
      lapMs,
      overallMs: overall,
    });
    this.callbacks.onUpdate();
  }

  tick() {
    if (!this.isRunning) return;
    this.elapsed = Date.now() - this.startedAt - this.accumulatedPause;
    this.callbacks.onUpdate();
  }

  getElapsedMs() {
    if (!this.startedAt) return 0;
    if (this.isPaused && this.pausedAt) {
      return this.pausedAt - this.startedAt - this.accumulatedPause;
    }
    if (this.isRunning) {
      return Date.now() - this.startedAt - this.accumulatedPause;
    }
    return this.elapsed;
  }

  msToParts(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = ms % 1000;
    return { hours: h, minutes: m, seconds: s, milliseconds: milli };
  }

  destroy() {
    clearInterval(this.tickInterval);
  }
}