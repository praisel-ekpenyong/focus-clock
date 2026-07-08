export function createTimerClock(tickMs = 400) {
  return {
    isRunning: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    accumulatedPause: 0,
    tickInterval: null,
    tickMs,
    elapsedSnapshot: 0,

    getElapsedMs() {
      if (!this.startedAt) return 0;
      if (this.isPaused && this.pausedAt) {
        return this.pausedAt - this.startedAt - this.accumulatedPause;
      }
      if (this.isRunning) {
        return Date.now() - this.startedAt - this.accumulatedPause;
      }
      return this.elapsedSnapshot;
    },

    getElapsedSeconds() {
      return Math.floor(this.getElapsedMs() / 1000);
    },

    resumeClock() {
      if (!this.startedAt) this.startedAt = Date.now();
      if (this.pausedAt) {
        this.accumulatedPause += Date.now() - this.pausedAt;
        this.pausedAt = null;
      }
      this.isRunning = true;
      this.isPaused = false;
    },

    pauseClock() {
      if (!this.isRunning) return;
      this.isRunning = false;
      this.isPaused = true;
      this.pausedAt = Date.now();
      this.elapsedSnapshot = this.getElapsedMs();
      this.stopTick();
    },

    resetClock() {
      this.isRunning = false;
      this.isPaused = false;
      this.startedAt = null;
      this.pausedAt = null;
      this.accumulatedPause = 0;
      this.elapsedSnapshot = 0;
      this.stopTick();
    },

    startTick(onTick) {
      this.stopTick();
      this.tickInterval = setInterval(onTick, this.tickMs);
    },

    stopTick() {
      if (this.tickInterval) {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
      }
    },

    destroy() {
      this.stopTick();
    },
  };
}