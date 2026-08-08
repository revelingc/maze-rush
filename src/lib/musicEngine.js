// Procedural techno/dubstep loop generator using the Web Audio API.
// All audio is synthesized in-browser — no external files, fully offline.
// Original composition; contains no copyrighted material.

const BPM = 140;
const SECONDS_PER_BEAT = 60 / BPM;
const LOOKAHEAD = 25; // ms scheduler tick
const SCHEDULE_AHEAD = 0.12; // seconds to schedule ahead

// 16-step pattern across one bar (4 beats × 4 sixteenths).
const KICK = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const HAT = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const BASS = [
  55, 0, 0, 0, 55, 0, 0, 41, 55, 0, 0, 0, 65, 0, 0, 41,
];
const LEAD = [
  0, 0, 330, 0, 0, 0, 392, 0, 0, 0, 330, 0, 440, 0, 392, 0,
];

export class MusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.timer = null;
    this.nextStepTime = 0;
    this.step = 0;
    this.enabled = false;
    this.volume = 0.6;
    this.started = false;
  }

  ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.enabled && this.started) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.enabled && this.started ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
    if (this.enabled && this.started && this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  async start() {
    if (this.started) {
      // Already running — just wake the context if the browser suspended it.
      if (this.ctx && this.ctx.state === "suspended") {
        try { await this.ctx.resume(); } catch (e) { /* ignore */ }
      }
      return;
    }
    this.ensureContext();
    if (!this.ctx) return;
    // Claim before any await so a concurrent start() can't spawn a 2nd timer.
    this.started = true;
    if (this.ctx.state === "suspended") {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
    this.setEnabled(this.enabled);
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.step = 0;
    this.timer = setInterval(() => this.scheduler(), LOOKAHEAD);
  }

  stop() {
    this.started = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Mute only — never suspend. Suspending freezes already-scheduled notes,
    // which then replay on top of the next start()'s fresh schedule (the
    // "music plays over itself" bug). Letting them tail off silently keeps
    // restarts clean.
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  scheduler() {
    if (!this.ctx) return;
    const stepDur = SECONDS_PER_BEAT / 4;
    while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      this.playStep(this.step, this.nextStepTime);
      this.nextStepTime += stepDur;
      this.step = (this.step + 1) % 16;
    }
  }

  playStep(step, time) {
    if (KICK[step]) this.kick(time);
    if (SNARE[step]) this.snare(time);
    if (HAT[step]) this.hat(time, step % 2 === 0 ? 0.18 : 0.1);
    const bassFreq = BASS[step];
    if (bassFreq) this.bass(bassFreq, time, SECONDS_PER_BEAT / 4);
    const leadFreq = LEAD[step];
    if (leadFreq) this.lead(leadFreq, time, SECONDS_PER_BEAT / 2);
  }

  kick(time) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.42);
  }

  snare(time) {
    const ctx = this.ctx;
    const dur = 0.18;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(hp).connect(gain).connect(this.master);
    noise.start(time);
    noise.stop(time + dur);
  }

  hat(time, vol) {
    const ctx = this.ctx;
    const dur = 0.04;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(hp).connect(gain).connect(this.master);
    noise.start(time);
    noise.stop(time + dur);
  }

  bass(freq, time, dur) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    sub.type = "sine";
    sub.frequency.value = freq / 2;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, time);
    lp.frequency.exponentialRampToValueAtTime(180, time + dur * 0.8);
    lp.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.45, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(lp);
    sub.connect(lp);
    lp.connect(gain).connect(this.master);
    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.02);
    sub.stop(time + dur + 0.02);
  }

  lead(freq, time, dur) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const detune = ctx.createOscillator();
    detune.type = "sawtooth";
    detune.frequency.value = freq * 1.005;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3500;
    osc.connect(lp);
    detune.connect(lp);
    lp.connect(gain).connect(this.master);
    osc.start(time);
    detune.start(time);
    osc.stop(time + dur + 0.02);
    detune.stop(time + dur + 0.02);
  }
}

let instance = null;
export function getMusicEngine() {
  if (!instance) instance = new MusicEngine();
  return instance;
}