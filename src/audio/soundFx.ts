import type { SceneId, SurfaceType } from '../types/game';

export class SoundFX {
  private ctx: AudioContext | null = null;
  private ambGain: GainNode | null = null;
  private ambSrc: AudioBufferSourceNode | null = null;
  private ambFilter: BiquadFilterNode | null = null;
  private _pendingSceneId: SceneId | null = null;
  private _lastPlay: Record<string, number> = {};
  private audioOn = true;

  setAudioOn(on: boolean): void {
    this.audioOn = on;
    if (this._pendingSceneId) {
      this.setAmbient(this._pendingSceneId);
    }
  }

  init(): void {
    if (this.ctx) {
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) {
      return;
    }
    try {
      this.ctx = new AC();
      this.ambGain = this.ctx.createGain();
      this.ambGain.gain.value = 0;
      this.ambFilter = this.ctx.createBiquadFilter();
      this.ambFilter.type = 'lowpass';
      this.ambFilter.frequency.value = 320;
      const buf = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * 2,
        this.ctx.sampleRate,
      );
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.04 * w) / 1.04;
        d[i] = last * 2.8;
      }
      this.ambSrc = this.ctx.createBufferSource();
      this.ambSrc.buffer = buf;
      this.ambSrc.loop = true;
      this.ambSrc.connect(this.ambFilter);
      this.ambFilter.connect(this.ambGain);
      this.ambGain.connect(this.ctx.destination);
      this.ambSrc.start();
      if (this._pendingSceneId) {
        this.setAmbient(this._pendingSceneId);
      }
    } catch {
      this.ctx = null;
    }
  }

  resume(): void {
    if (!this.audioOn) {
      return;
    }
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setAmbient(sceneId: SceneId): void {
    this._pendingSceneId = sceneId;
    if (this.audioOn && !this.ctx) {
      this.init();
    }
    if (this.audioOn && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.ctx || !this.ambGain || !this.ambFilter) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!this.audioOn) {
      this.ambGain.gain.setTargetAtTime(0, now, 0.2);
      return;
    }
    const cfg: [number, number] =
      (
        {
          platform: [520, 0.08],
          hellstone: [160, 0.09],
          office: [240, 0.025],
          mall: [440, 0.045],
          garage: [140, 0.04],
          infirmary: [300, 0.018],
          school_bbq: [480, 0.04],
          zigzag: [620, 0.035],
          park_lot: [700, 0.04],
          hospital: [190, 0.03],
          airport: [350, 0.05],
          waterpark: [820, 0.065],
          convenience: [320, 0.035],
          subway: [210, 0.075],
          studio: [380, 0.018],
          cave: [130, 0.055],
        } as Record<SceneId, [number, number]>
      )[sceneId] || [300, 0.03];
    this.ambFilter.frequency.setTargetAtTime(cfg[0], now, 0.4);
    this.ambGain.gain.setTargetAtTime(cfg[1], now, 0.4);
  }

  step(surface: SurfaceType): void {
    if (!this.audioOn || !this.ctx) {
      return;
    }
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    let freq = 110;
    let dur = 0.07;
    let vol = 0.06;
    let cut = 550;
    if (surface === 'wood') {
      freq = 150;
      dur = 0.08;
      vol = 0.08;
    } else if (surface === 'metal') {
      freq = 240;
      dur = 0.09;
      vol = 0.06;
    } else if (surface === 'water') {
      freq = 420;
      dur = 0.11;
      vol = 0.05;
      cut = 1200;
    } else if (surface === 'grass') {
      freq = 85;
      dur = 0.06;
      vol = 0.035;
    } else if (surface === 'carpet') {
      freq = 70;
      dur = 0.055;
      vol = 0.025;
      cut = 260;
    } else if (surface === 'dirt') {
      freq = 92;
      dur = 0.07;
      vol = 0.045;
      cut = 380;
    } else if (surface === 'marble') {
      freq = 165;
      dur = 0.05;
      vol = 0.03;
      cut = 720;
    }
    o.type = surface === 'water' ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(freq * (0.92 + Math.random() * 0.16), t);
    o.frequency.exponentialRampToValueAtTime(40, t + dur);
    f.type = 'lowpass';
    f.frequency.value = cut;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  play(type: string): void {
    if (!this.audioOn) {
      return;
    }
    const nowMs = performance.now();
    if (this._lastPlay[type] && nowMs - this._lastPlay[type] < 140) {
      return;
    }
    this._lastPlay[type] = nowMs;
    this.resume();
    if (!this.ctx) {
      return;
    }
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const tone = (
      freq: number,
      dur: number,
      tp: OscillatorType = 'sine',
      vol = 0.08,
      slide: number | null = null,
    ) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = tp;
      o.frequency.setValueAtTime(freq, t);
      if (slide) {
        o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      }
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
    };
    if (type === 'switch') {
      tone(680, 0.06, 'square', 0.04, 420);
    } else if (type === 'bell') {
      tone(1320, 0.45, 'sine', 0.09);
      window.setTimeout(() => tone(1980, 0.35, 'sine', 0.04), 20);
    } else if (type === 'chime') {
      tone(880, 0.28, 'sine', 0.07);
      window.setTimeout(() => tone(1108, 0.35, 'sine', 0.06), 110);
    } else if (type === 'paper') {
      tone(340, 0.09, 'triangle', 0.04, 520);
    } else if (type === 'door') {
      tone(95, 0.35, 'sawtooth', 0.05, 58);
    } else if (type === 'splash') {
      tone(280, 0.22, 'sine', 0.08, 740);
    } else if (type === 'collect') {
      tone(587, 0.12, 'sine', 0.07);
      window.setTimeout(() => tone(880, 0.24, 'sine', 0.08), 90);
    } else if (type === 'wood') {
      tone(190, 0.11, 'triangle', 0.09, 110);
    } else if (type === 'train') {
      tone(72, 0.7, 'sawtooth', 0.06, 64);
    } else if (type === 'sizzle') {
      tone(920, 0.18, 'sawtooth', 0.03, 400);
    } else if (type === 'paint') {
      tone(310, 0.08, 'sine', 0.04, 220);
    } else if (type === 'cat') {
      tone(520, 0.22, 'sine', 0.05, 680);
    } else if (type === 'click') {
      tone(1040, 0.04, 'sine', 0.05, 760);
    } else {
      tone(460, 0.1, 'sine', 0.06);
    }
  }

  dispose(): void {
    try {
      this.ambSrc?.stop();
      this.ctx?.close();
    } catch {
      // ignore close errors
    }
    this.ctx = null;
    this.ambSrc = null;
    this.ambGain = null;
    this.ambFilter = null;
  }
}
