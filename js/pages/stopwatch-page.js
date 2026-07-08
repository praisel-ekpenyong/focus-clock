import { Stopwatch } from '../stopwatch-engine.js';

let cleanup = null;
let sw = null;

function formatLapParts(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const milli = ms % 1000;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  parts.push(`${String(milli).padStart(3, '0')}ms`);
  return parts.join(' ');
}

export function renderStopwatchPage(outlet) {
  if (cleanup) cleanup();
  if (sw) sw.destroy();

  sw = new Stopwatch({ onUpdate: () => render(outlet) });

  outlet.innerHTML = `
    <div class="page-stopwatch">
      <section class="sw-timer-panel" id="swPanel">
        <button class="action-icon-btn sw-fs-btn" id="swFullscreen" title="Fullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </button>
        <div class="sw-display" id="swDisplay"></div>
        <div class="sw-controls" id="swControls"></div>
      </section>
      <section class="sw-laps-panel">
        <div class="sw-laps-header">
          <span>LAP</span>
          <span>LAP TIME</span>
          <span>OVERALL TIME</span>
        </div>
        <div class="sw-laps-body" id="swLapsBody">
          <p class="sw-laps-empty">No laps yet.</p>
        </div>
      </section>
    </div>
  `;

  function render() {
    const elapsed = sw.getElapsedMs();
    const { hours, minutes, seconds, milliseconds } = sw.msToParts(elapsed);

    outlet.querySelector('#swDisplay').innerHTML = `
      <div class="sw-time-display">
        ${hours > 0 ? `<span class="sw-part"><span class="sw-val">${String(hours).padStart(2,'0')}</span><span class="sw-unit">h</span></span>` : ''}
        ${minutes > 0 || hours > 0 ? `<span class="sw-part"><span class="sw-val">${String(minutes).padStart(2,'0')}</span><span class="sw-unit">m</span></span>` : ''}
        <span class="sw-part"><span class="sw-val">${String(seconds).padStart(2,'0')}</span><span class="sw-unit">s</span></span>
        <span class="sw-part"><span class="sw-val">${String(milliseconds).padStart(3,'0')}</span><span class="sw-unit">ms</span></span>
      </div>
    `;

    const controls = outlet.querySelector('#swControls');
    if (!sw.startedAt && !sw.isPaused) {
      controls.innerHTML = `
        <button class="control-btn primary" id="swStart">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Timer
        </button>
      `;
      outlet.querySelector('#swStart').onclick = () => sw.start();
    } else {
      controls.innerHTML = `
        ${!sw.isPaused ? '<button class="control-btn" id="swLap">Lap</button>' : ''}
        ${sw.isPaused
          ? '<button class="control-btn" id="swResume">Resume</button>'
          : '<button class="control-btn" id="swPause">Pause</button>'}
        <button class="control-btn" id="swReset">Reset</button>
      `;
      outlet.querySelector('#swLap')?.addEventListener('click', () => sw.lap());
      outlet.querySelector('#swPause')?.addEventListener('click', () => sw.pause());
      outlet.querySelector('#swResume')?.addEventListener('click', () => sw.start());
      outlet.querySelector('#swReset')?.addEventListener('click', () => sw.reset());
    }

    const lapsBody = outlet.querySelector('#swLapsBody');
    if (sw.laps.length === 0 && !sw.isRunning) {
      lapsBody.innerHTML = '<p class="sw-laps-empty">No laps yet.</p>';
    } else {
      const currentLap = sw.isRunning ? (() => {
        const overall = sw.getElapsedMs();
        const prev = sw.laps.length ? sw.laps[sw.laps.length - 1].overallMs : 0;
        return { lapMs: overall - prev, overallMs: overall };
      })() : null;

      const rows = [...sw.laps].reverse().map((lap, i) => `
        <div class="sw-lap-row">
          <span class="sw-lap-num">${sw.laps.length - i}</span>
          <span class="sw-lap-time">${formatLapParts(lap.lapMs)}</span>
          <span class="sw-lap-overall">${formatLapParts(lap.overallMs)}</span>
        </div>
      `).join('');

      const currentRow = currentLap ? `
        <div class="sw-lap-row sw-lap-current">
          <span class="sw-lap-num">${sw.laps.length + 1}</span>
          <span class="sw-lap-time">${formatLapParts(currentLap.lapMs)}</span>
          <span class="sw-lap-overall">${formatLapParts(currentLap.overallMs)}</span>
        </div>
      ` : '';

      lapsBody.innerHTML = currentRow + rows;
    }
  }

  outlet.querySelector('#swFullscreen').onclick = () => {
    outlet.querySelector('#swPanel').classList.toggle('panel-fullscreen');
  };

  render();

  cleanup = () => {
    if (sw) { sw.destroy(); sw = null; }
    cleanup = null;
  };
}

export function destroyStopwatchPage() {
  if (cleanup) cleanup();
}

export const stopwatchBreadcrumb = `<span class="breadcrumb-item">Stopwatch</span>`;