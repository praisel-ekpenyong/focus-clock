import { subscribeHourFormat } from './event-bus.js';

export function createPageScope() {
  const intervals = [];
  const listeners = [];
  const unsubscribers = [];

  return {
    on(el, event, handler, options) {
      if (!el) return;
      el.addEventListener(event, handler, options);
      listeners.push({ el, event, handler, options });
    },

    interval(fn, ms) {
      const id = setInterval(fn, ms);
      intervals.push(id);
      return id;
    },

    onHourFormatChange(handler) {
      unsubscribers.push(subscribeHourFormat(handler));
    },

    destroy() {
      intervals.forEach(clearInterval);
      intervals.length = 0;
      listeners.forEach(({ el, event, handler, options }) => {
        el.removeEventListener(event, handler, options);
      });
      listeners.length = 0;
      unsubscribers.forEach((off) => off());
      unsubscribers.length = 0;
    },
  };
}