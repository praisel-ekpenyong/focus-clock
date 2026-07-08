const HOUR_FORMAT_EVENT = 'hourformatchange';

export function subscribeHourFormat(handler) {
  window.addEventListener(HOUR_FORMAT_EVENT, handler);
  return () => window.removeEventListener(HOUR_FORMAT_EVENT, handler);
}

export function emitHourFormatChange() {
  window.dispatchEvent(new CustomEvent(HOUR_FORMAT_EVENT));
}