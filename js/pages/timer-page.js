import { saveState } from '../storage.js';
import { generateId } from '../format-date.js';
import { escapeHtml, padTime } from '../dom.js';
import { APP_NAME } from '../constants.js';
import { createPageScope } from '../page-lifecycle.js';
import { alarmSoundSelectHtml, readAlarmSound } from '../sound-settings.js';
import { CountdownTimer } from '../countdown-timer.js';
import { playAlarm, playChime } from '../sounds.js';
import { showToast } from '../shared.js';

const BUILT_IN_PRESETS = [
  { label: '5 min', h: 0, m: 5, s: 0 },
  { label: '10 min', h: 0, m: 10, s: 0 },
  { label: '15 min', h: 0, m: 15, s: 0 },
  { label: '20 min', h: 0, m: 20, s: 0 },
  { label: '30 min', h: 0, m: 30, s: 0 },
  { label: '1 hour', h: 1, m: 0, s: 0 },
  { label: '2 hour', h: 2, m: 0, s: 0 },
  { label: '3 hour', h: 3, m: 0, s: 0 },
];

let scope = null;
let timer = null;
let lastChimeKey = null;

export function renderTimerPage(outlet, state) {
  destroyTimerPage();
  scope = createPageScope();

  function checkChime() {
    const interval = state.settings.timerChimeInterval;
    if (!interval || !timer.isRunning) return;
    const elapsed = timer.totalSeconds - timer.remainingSeconds;
    const chimeKey = Math.floor(elapsed / (interval * 60));
    if (chimeKey > 0 && chimeKey !== lastChimeKey) {
      lastChimeKey = chimeKey;
      playChime();
    }
  }

  timer = new CountdownTimer({
    onUpdate: () => {
      checkChime();
      renderRunning();
    },
    onComplete: () => {
      playAlarm(state.settings.timerSound);
      document.title = "Time's up!";
      renderRunning();
    },
  });

  outlet.innerHTML = `
    <div class="page-timer">
      <section class="timer-main-panel" id="timerMainPanel">
        <div class="timer-panel-actions">
          <button class="action-icon-btn" id="timerSettingsBtn" title="Sound settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
          </button>
          <button class="action-icon-btn" id="timerFullscreen" title="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
        <div id="timerSetupView">
          <p class="timer-setup-label">Enter timer Duration below</p>
          <div class="timer-duration-input">
            <div class="duration-field">
              <input type="text" class="duration-val" id="durHours" value="00" maxlength="2">
              <span class="duration-unit">hour</span>
            </div>
            <span class="duration-sep">:</span>
            <div class="duration-field">
              <input type="text" class="duration-val" id="durMinutes" value="00" maxlength="2">
              <span class="duration-unit">min</span>
            </div>
            <span class="duration-sep">:</span>
            <div class="duration-field">
              <input type="text" class="duration-val" id="durSeconds" value="00" maxlength="2">
              <span class="duration-unit">sec</span>
            </div>
          </div>
          <div class="timer-start-row">
            <button class="action-icon-btn" id="timerSoundBtn" title="Sounds">♪</button>
            <button class="control-btn primary" id="timerStartBtn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Timer
            </button>
          </div>
        </div>
        <div id="timerRunningView" class="hidden"></div>
      </section>
      <section class="timer-presets-panel">
        <button class="preset-create-btn" id="createPresetBtn">+ CREATE NEW PRESET</button>
        <div class="presets-grid" id="presetsGrid"></div>
        <p class="presets-empty hidden" id="presetsEmpty">No custom presets yet. Use + CREATE NEW PRESET above.</p>
      </section>
    </div>
    <div class="modal-overlay hidden" id="timerSoundModal">
      <div class="modal">
        <label class="modal-label">Alarm sound when timer ends</label>
        ${alarmSoundSelectHtml('timerSoundSelect', state.settings.timerSound)}
        <label class="modal-label">Interval chime during countdown</label>
        <select class="modal-input" id="timerChimeSelect">
          <option value="0">Off</option>
          <option value="1">Every 1 minute</option>
          <option value="5">Every 5 minutes</option>
          <option value="10">Every 10 minutes</option>
          <option value="15">Every 15 minutes</option>
          <option value="30">Every 30 minutes</option>
        </select>
        <button class="btn-primary modal-submit" id="timerSoundSave">Save</button>
      </div>
    </div>
    <div class="modal-overlay hidden" id="presetModal">
      <div class="modal">
        <label class="modal-label">Preset name</label>
        <input type="text" class="modal-input" id="presetName" placeholder="My preset">
        <label class="modal-label">Duration (minutes)</label>
        <input type="number" class="modal-input" id="presetMinutes" min="1" max="999" value="25">
        <button class="btn-primary modal-submit" id="presetSave">Save Preset</button>
        <button class="btn-secondary" id="presetCancel">Cancel</button>
      </div>
    </div>
  `;

  function clampInput(el) {
    let v = parseInt(el.value, 10);
    if (isNaN(v)) v = 0;
    v = Math.min(99, Math.max(0, v));
    el.value = padTime(v);
    return v;
  }

  ['durHours', 'durMinutes', 'durSeconds'].forEach((id) => {
    const el = outlet.querySelector(`#${id}`);
    el.onblur = () => clampInput(el);
    el.onkeydown = (e) => {
      if (e.key === 'ArrowUp') { el.value = padTime(Math.min(99, parseInt(el.value || 0, 10) + 1)); e.preventDefault(); }
      if (e.key === 'ArrowDown') { el.value = padTime(Math.max(0, parseInt(el.value || 0, 10) - 1)); e.preventDefault(); }
    };
  });

  function getInputDuration() {
    return {
      h: clampInput(outlet.querySelector('#durHours')),
      m: clampInput(outlet.querySelector('#durMinutes')),
      s: clampInput(outlet.querySelector('#durSeconds')),
    };
  }

  function renderPresets() {
    const grid = outlet.querySelector('#presetsGrid');
    const empty = outlet.querySelector('#presetsEmpty');
    const all = [...BUILT_IN_PRESETS, ...state.timerPresets.map((p) => ({
      label: p.label,
      h: Math.floor(p.minutes / 60),
      m: p.minutes % 60,
      s: 0,
      custom: true,
      id: p.id,
    }))];

    grid.innerHTML = all.map((p) => `
      <button class="preset-btn" data-h="${p.h}" data-m="${p.m}" data-s="${p.s}" data-label="${escapeHtml(p.label)}">
        ${escapeHtml(p.label)}
        ${p.custom ? `<span class="preset-delete" data-id="${p.id}">×</span>` : ''}
      </button>
    `).join('');

    empty.classList.toggle('hidden', true);

    grid.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.onclick = (e) => {
        if (e.target.classList.contains('preset-delete')) {
          const id = e.target.dataset.id;
          state.timerPresets = state.timerPresets.filter((p) => p.id !== id);
          saveState(state);
          renderPresets();
          return;
        }
        const h = parseInt(btn.dataset.h, 10);
        const m = parseInt(btn.dataset.m, 10);
        const s = parseInt(btn.dataset.s, 10);
        outlet.querySelector('#durHours').value = padTime(h);
        outlet.querySelector('#durMinutes').value = padTime(m);
        outlet.querySelector('#durSeconds').value = padTime(s);
        timer.setDuration(h, m, s, btn.dataset.label);
        showSetup(false);
        renderRunning();
      };
    });
  }

  function showSetup(show) {
    outlet.querySelector('#timerSetupView').classList.toggle('hidden', !show);
    outlet.querySelector('#timerRunningView').classList.toggle('hidden', show);
  }

  function renderRunning() {
    if (!timer.totalSeconds && !timer.isRunning && !timer.isPaused && !timer.isCompleted) {
      showSetup(true);
      return;
    }
    showSetup(false);
    const { hours, minutes, seconds } = timer.getDisplay();
    const elapsed = timer.getElapsed();
    const h = hours > 0, m = minutes > 0 || h;

    outlet.querySelector('#timerRunningView').innerHTML = `
      ${timer.label ? `<div class="timer-label-badge"><span class="timer-pulse"></span>${escapeHtml(timer.label)}</div>` : '<p class="timer-remaining-label">Remaining Time</p>'}
      <div class="timer-remaining-display">
        ${h ? `<div class="timer-unit-block"><span class="timer-unit-val">${padTime(hours)}</span><span class="timer-unit-name">Hr</span></div>` : ''}
        ${m ? `<div class="timer-unit-block"><span class="timer-unit-val">${padTime(minutes)}</span><span class="timer-unit-name">Min</span></div>` : ''}
        <div class="timer-unit-block"><span class="timer-unit-val">${padTime(seconds)}</span><span class="timer-unit-name">Sec</span></div>
      </div>
      <div class="timer-progress-section">
        <div class="timer-progress-header">
          <span>${hours ? `${hours} hr ` : ''}${minutes ? `${minutes} min ` : ''}${seconds} sec left</span>
          <div class="timer-progress-actions">
            ${timer.isPaused
              ? '<button class="timer-link-btn" id="timerResume">Resume</button>'
              : '<button class="timer-link-btn" id="timerPause">Pause</button>'}
            <button class="timer-link-btn" id="timerReset">Reset</button>
          </div>
        </div>
        <div class="timer-progress-bar-lg">
          <div class="timer-progress-fill-lg" style="width:${100 - timer.getProgress()}%"></div>
          <span class="timer-elapsed-hint">${elapsed.hours ? `${elapsed.hours} hr ` : ''}${elapsed.minutes ? `${elapsed.minutes} min ` : ''}${elapsed.seconds} sec elapsed</span>
        </div>
        <div class="time-adjust">
          ${[25, 10, 5, 1].map((n) => `<button class="adjust-btn" data-add="${n}">+ ${n} min</button>`).join('')}
        </div>
      </div>
    `;

    outlet.querySelector('#timerPause')?.addEventListener('click', () => timer.pause());
    outlet.querySelector('#timerResume')?.addEventListener('click', () => timer.start());
    outlet.querySelector('#timerReset')?.addEventListener('click', () => { timer.reset(); lastChimeKey = null; showSetup(true); });
    outlet.querySelectorAll('[data-add]').forEach((btn) => {
      btn.onclick = () => { timer.addMinutes(parseInt(btn.dataset.add, 10)); if (!timer.isRunning && !timer.isPaused) timer.start(); };
    });

    if (timer.isRunning) {
      document.title = `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)} - Timer`;
    }
  }

  outlet.querySelector('#timerStartBtn').onclick = () => {
    const { h, m, s } = getInputDuration();
    if (h === 0 && m === 0 && s === 0) { showToast('Set a duration first'); return; }
    timer.setDuration(h, m, s);
    lastChimeKey = null;
    timer.start();
    renderRunning();
  };

  outlet.querySelector('#timerSettingsBtn').onclick = () => {
    outlet.querySelector('#timerSoundSelect').value = state.settings.timerSound;
    outlet.querySelector('#timerChimeSelect').value = String(state.settings.timerChimeInterval || 0);
    outlet.querySelector('#timerSoundModal').classList.remove('hidden');
  };
  outlet.querySelector('#timerSoundSave').onclick = () => {
    state.settings.timerSound = readAlarmSound(outlet.querySelector('#timerSoundSelect'));
    state.settings.timerChimeInterval = parseInt(outlet.querySelector('#timerChimeSelect').value, 10);
    saveState(state);
    outlet.querySelector('#timerSoundModal').classList.add('hidden');
    showToast('Settings saved');
  };
  outlet.querySelector('#timerSoundBtn').onclick = () => outlet.querySelector('#timerSettingsBtn').click();

  outlet.querySelector('#createPresetBtn').onclick = () => {
    outlet.querySelector('#presetModal').classList.remove('hidden');
  };
  outlet.querySelector('#presetSave').onclick = () => {
    const label = outlet.querySelector('#presetName').value.trim();
    const minutes = parseInt(outlet.querySelector('#presetMinutes').value, 10);
    if (!label || !minutes) return;
    state.timerPresets.push({ id: generateId(), label, minutes });
    saveState(state);
    outlet.querySelector('#presetModal').classList.add('hidden');
    renderPresets();
  };
  outlet.querySelector('#presetCancel').onclick = () => outlet.querySelector('#presetModal').classList.add('hidden');

  outlet.querySelector('#timerFullscreen').onclick = () => {
    outlet.querySelector('#timerMainPanel').classList.toggle('panel-fullscreen');
  };

  showSetup(true);
  renderPresets();
}

export function destroyTimerPage() {
  if (timer) { timer.destroy(); timer = null; }
  if (scope) { scope.destroy(); scope = null; }
  document.title = APP_NAME;
}

export const timerBreadcrumb = `<span class="breadcrumb-item">Timer</span>`;