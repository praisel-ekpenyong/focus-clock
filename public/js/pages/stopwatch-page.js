import { padTime } from '../dom.js';
import { createPageScope } from '../page-lifecycle.js';
import { Stopwatch } from '../stopwatch-engine.js';

let scope = null;
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
  parts.push(`${padTime(milli, 3)}ms`);
  return parts.join(' ');
}

export function renderStopwatchPage(outlet) {
  destroyStopwatchPage();
  scope = createPageScope();

  let controlKey = '';
  let displayReady = false;

  sw = new Stopwatch({
    onUpdate: () => {
      updateDisplay();
      updateControls();
      updateLaps();
    },
  });

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

  function ensureDisplayShell() {
    if (displayReady) return;
    outlet.querySelector('#swDisplay').innerHTML = `
      <div class="sw-time-display">
        <span class="sw-part sw-part-h"><span class="sw-val" id="swHVal">00</span><span class="sw-unit">h</span></span>
        <span class="sw-part sw-part-m"><span class="sw-val" id="swMVal">00</span><span class="sw-unit">m</span></span>
        <span class="sw-part"><span class="sw-val" id="swSVal">00</span><span class="sw-unit">s</span></span>
        <span class="sw-part"><span class="sw-val" id="swMsVal">000</span><span class="sw-unit">ms</span></span>
      </div>
    `;
    displayReady = true;
  }

  function updateDisplay() {
    ensureDisplayShell();
    const { hours, minutes, seconds, milliseconds } = sw.msToParts(sw.getElapsedMs());

    outlet.querySelector('#swHVal').textContent = padTime(hours);
    outlet.querySelector('#swMVal').textContent = padTime(minutes);
    outlet.querySelector('#swSVal').textContent = padTime(seconds);
    outlet.querySelector('#swMsVal').textContent = padTime(milliseconds, 3);

    outlet.querySelector('.sw-part-h')?.classList.toggle('hidden', hours === 0);
    outlet.querySelector('.sw-part-m')?.classList.toggle('hidden', minutes === 0 && hours === 0);
  }

  function getControlKey() {
    if (!sw.startedAt && !sw.isPaused) return 'idle';
    if (sw.isPaused) return 'paused';
    return 'running';
  }

  function updateControls() {
    const key = getControlKey();
    if (key === controlKey) return;
    controlKey = key;

    const controls = outlet.querySelector('#swControls');
    if (key === 'idle') {
      controls.innerHTML = `
        <button class="control-btn primary" id="swStart">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Timer
        </button>
      `;
      controls.querySelector('#swStart').onclick = () => sw.start();
      return;
    }

    controls.innerHTML = `
      ${key === 'running' ? '<button class="control-btn" id="swLap">Lap</button>' : ''}
      ${key === 'paused'
        ? '<button class="control-btn" id="swResume">Resume</button>'
        : '<button class="control-btn" id="swPause">Pause</button>'}
      <button class="control-btn" id="swReset">Reset</button>
    `;
    controls.querySelector('#swLap')?.addEventListener('click', () => sw.lap());
    controls.querySelector('#swPause')?.addEventListener('click', () => sw.pause());
    controls.querySelector('#swResume')?.addEventListener('click', () => sw.start());
    controls.querySelector('#swReset')?.addEventListener('click', () => {
      sw.reset();
      controlKey = '';
      updateLaps(true);
    });
  }

  let lastLapCount = -1;
  let lastRunning = false;

  function updateLaps(force = false) {
    const lapsBody = outlet.querySelector('#swLapsBody');
    const lapCount = sw.laps.length;
    const running = sw.isRunning;

    if (!force && lapCount === lastLapCount && running === lastRunning) {
      const currentRow = lapsBody.querySelector('.sw-lap-current');
      if (currentRow && running) {
        const overall = sw.getElapsedMs();
        const prev = sw.laps.length ? sw.laps[sw.laps.length - 1].overallMs : 0;
        currentRow.querySelector('.sw-lap-time').textContent = formatLapParts(overall - prev);
        currentRow.querySelector('.sw-lap-overall').textContent = formatLapParts(overall);
      }
      return;
    }

    lastLapCount = lapCount;
    lastRunning = running;

    if (lapCount === 0 && !running) {
      lapsBody.innerHTML = '<p class="sw-laps-empty">No laps yet.</p>';
      return;
    }

    const currentLap = running ? (() => {
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

  outlet.querySelector('#swFullscreen').onclick = () => {
    outlet.querySelector('#swPanel').classList.toggle('panel-fullscreen');
  };

  updateDisplay();
  updateControls();
  updateLaps(true);
}

export function destroyStopwatchPage() {
  if (sw) { sw.destroy(); sw = null; }
  if (scope) { scope.destroy(); scope = null; }
}

export const stopwatchBreadcrumb = `<span class="breadcrumb-item">Stopwatch</span>`;