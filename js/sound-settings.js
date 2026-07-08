import { ALARM_SOUND_OPTIONS } from './constants.js';

export function alarmSoundSelectHtml(id, selected = 'beep') {
  const options = ALARM_SOUND_OPTIONS.map(
    (o) => `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`
  ).join('');
  return `<select class="modal-input" id="${id}">${options}</select>`;
}

export function readAlarmSound(selectEl) {
  return selectEl?.value || 'beep';
}