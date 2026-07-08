import { escapeHtml, padTime } from '../dom.js';
import { APP_NAME } from '../constants.js';
import { alarmSoundSelectHtml } from '../sound-settings.js';

export const TOMATO_SVG = '<svg class="tomato-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 2 7.5 3.5 7 5.5 5 5 3.5 6.5 3 8.5 3 11c0 4 3.5 7 9 7s9-3 9-7c0-2-.5-3.5-2-4-.5-2-2.5-3.5-5-3.5-.5-2-2.5-3.5-5-3.5z"/></svg>';

export function renderTimerDisplayHtml(parts) {
  if (parts.hours > 0) {
    return (
      `<span>${padTime(parts.hours)}</span><span class="timer-sep">:</span>` +
      `<span>${padTime(parts.minutes)}</span><span class="timer-sep">:</span>` +
      `<span>${padTime(parts.seconds)}</span>`
    );
  }
  return (
    `<span>${padTime(parts.minutes)}</span><span class="timer-sep">:</span>` +
    `<span>${padTime(parts.seconds)}</span>`
  );
}

export function renderTimerControlsHtml(timer) {
  if (timer.isCompleted) {
    return (
      '<button class="control-btn primary" id="startBtn"><span>Start</span></button>' +
      '<button class="control-btn" id="resetBtn"><span>Reset</span></button>'
    );
  }
  if (timer.isRunning) {
    return (
      '<button class="control-btn" id="pauseBtn"><span>Pause</span></button>' +
      '<button class="control-btn" id="resetBtn"><span>Reset</span></button>'
    );
  }
  if (timer.isPaused) {
    return (
      '<button class="control-btn primary" id="startBtn"><span>Resume</span></button>' +
      '<button class="control-btn" id="resetBtn"><span>Reset</span></button>'
    );
  }
  return '<button class="control-btn primary" id="startBtn"><span>Start</span></button>';
}

export function renderTaskItemHtml(task, { activeTaskId, taskTab }) {
  const playing = activeTaskId === task.id;
  return (
    `<li class="task-item${task.completed ? ' completed' : ''}${playing ? ' playing' : ''}" data-id="${task.id}"${taskTab === 'pending' ? ' draggable="true"' : ''}>` +
    (!task.completed
      ? `<button class="task-play-btn${playing ? ' playing' : ''}" data-play="${task.id}" title="Start with this task">▶</button>`
      : `<button class="task-check-btn" data-uncomplete="${task.id}" title="Mark pending">✓</button>`) +
    `<span class="task-text" data-edit="${task.id}">${escapeHtml(task.title)}</span>` +
    `<div class="task-actions">` +
    (!task.completed ? `<button class="task-action-btn" data-complete="${task.id}" title="Complete">✓</button>` : '') +
    `<button class="task-action-btn" data-delete="${task.id}" title="Delete">×</button>` +
    `</div></li>`
  );
}

export function settingsModalHtml(settings) {
  return (
    '<div class="modal-overlay hidden" id="settingsModal">' +
    '<div class="modal">' +
    '<label class="modal-label">Focus duration (minutes)</label>' +
    `<input type="number" class="modal-input" id="focusMinutesInput" min="1" max="180" value="${settings.focusMinutes}">` +
    '<label class="modal-label">Short break (minutes)</label>' +
    `<input type="number" class="modal-input" id="shortBreakInput" min="1" max="60" value="${settings.shortBreakMinutes}">` +
    '<label class="modal-label">Long break (minutes)</label>' +
    `<input type="number" class="modal-input" id="longBreakInput" min="1" max="60" value="${settings.longBreakMinutes}">` +
    '<label class="modal-label">Alarm sound</label>' +
    alarmSoundSelectHtml('alarmSoundSelect', settings.alarmSound) +
    '<button class="btn-primary modal-submit" id="settingsSave">Save</button>' +
    '</div></div>'
  );
}

export function pomodoroDocumentTitle(timer) {
  if (timer.isRunning) return `${timer.formatTimeString()} - ${timer.getModeLabel()}`;
  if (timer.isCompleted) return `${timer.getModeLabel()} complete!`;
  return `${APP_NAME} — Pomodoro`;
}