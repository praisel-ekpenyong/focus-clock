const HOUR_FORMAT_EVENT = 'hourformatchange';
const STORAGE_SAVE_FAILED_EVENT = 'storagesavefailed';

export function subscribeHourFormat(handler) {
  window.addEventListener(HOUR_FORMAT_EVENT, handler);
  return () => window.removeEventListener(HOUR_FORMAT_EVENT, handler);
}

export function emitHourFormatChange() {
  window.dispatchEvent(new CustomEvent(HOUR_FORMAT_EVENT));
}

export function subscribeStorageSaveFailed(handler) {
  window.addEventListener(STORAGE_SAVE_FAILED_EVENT, handler);
  return () => window.removeEventListener(STORAGE_SAVE_FAILED_EVENT, handler);
}

export function emitStorageSaveFailed() {
  window.dispatchEvent(new CustomEvent(STORAGE_SAVE_FAILED_EVENT));
}