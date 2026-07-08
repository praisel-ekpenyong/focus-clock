let audioCtx = null;
let ambientNode = null;
let ambientGain = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

async function ensureAudioReady() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch { /* browser blocked audio */ }
  }
  return ctx;
}

export async function playChime() {
  const ctx = await ensureAudioReady();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export async function playAlarm(type = 'beep') {
  const ctx = await ensureAudioReady();
  const now = ctx.currentTime;

  if (type === 'chime') {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
    return;
  }

  if (type === 'alarm') {
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = i % 2 === 0 ? 880 : 660;
      const t = now + i * 0.3;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.setValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
    return;
  }

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    const t = now + i * 0.4;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }
}

function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export async function startAmbientSound(type) {
  stopAmbientSound();
  if (!type || type === 'none') return;

  const ctx = await ensureAudioReady();
  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.08;
  ambientGain.connect(ctx.destination);

  if (type === 'white' || type === 'rain') {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.value = type === 'rain' ? 800 : 1000;
    filter.Q.value = type === 'rain' ? 0.5 : 1;

    source.connect(filter);
    filter.connect(ambientGain);
    source.start();
    ambientNode = source;
    return;
  }

  if (type === 'forest') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 180;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(ambientGain);
    lfo.start();
    osc.start();
    ambientNode = { stop: () => { osc.stop(); lfo.stop(); } };
  }
}

export function stopAmbientSound() {
  if (ambientNode) {
    try {
      ambientNode.stop();
    } catch { /* already stopped */ }
    ambientNode = null;
  }
  ambientGain = null;
}