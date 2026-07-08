import { padTime } from './dom.js';

export function secondsToParts(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  return {
    hours: Math.floor(s / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function msToParts(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return { hours: h, minutes: m, seconds: s, milliseconds };
}

export function formatClockParts({ hours, minutes, seconds }, { showHours = true } = {}) {
  if (showHours && hours > 0) {
    return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
  }
  return `${padTime(minutes)}:${padTime(seconds)}`;
}