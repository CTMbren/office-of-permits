// Generated sounds (WebAudio, no files). Audio starts on the first tap, as iOS requires.
import { signal } from '@preact/signals';

const MUTE_KEY = 'permits.muted';

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const muted = signal<boolean>(typeof window !== 'undefined' && readMuted());

export function toggleMute(): void {
  muted.value = !muted.value;
  try {
    window.localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0');
  } catch {
    /* preference just won't persist */
  }
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (muted.value || typeof window === 'undefined') return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const VOLUME = 0.6;

function tone(freq: number, dur: number, type: OscillatorType, gain: number, endFreq?: number, delay = 0): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(gain * VOLUME, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, freq: number, gain: number, q = 1): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = a.createGain();
  g.gain.value = gain * VOLUME;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  /** The stamp: a low thump with a papery slap. */
  stamp(streak = 0) {
    tone(90 + streak * 4, 0.16, 'sine', 0.9, 45);
    noise(0.07, 1800, 0.35, 0.7);
  },
  /** Paper sliding off the desk. */
  swish() {
    noise(0.22, 2600, 0.12, 0.5);
  },
  /** Coins dropping. */
  coin() {
    tone(1320, 0.12, 'triangle', 0.18);
    tone(1760, 0.16, 'triangle', 0.14, undefined, 0.06);
  },
  /** A quick quill scratch for checking a field. */
  check() {
    noise(0.09, 4200, 0.18, 2);
    noise(0.07, 3600, 0.12, 2);
  },
  /** End of shift bell. */
  bell() {
    tone(880, 1.2, 'sine', 0.35);
    tone(1320, 0.9, 'sine', 0.12);
  },
};
