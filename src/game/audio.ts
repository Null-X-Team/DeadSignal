export class Sfx {
  ctx: AudioContext | null = null;

  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  tone(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  shoot(bright: boolean) {
    this.tone(bright ? 880 : 420, 0.07, "square", 0.04);
    this.tone(bright ? 220 : 140, 0.09, "sawtooth", 0.03);
  }

  hit() {
    this.tone(180, 0.08, "triangle", 0.05);
  }

  buy() {
    this.tone(520, 0.08, "sine", 0.05);
    this.tone(780, 0.12, "sine", 0.04);
  }

  wave() {
    this.tone(220, 0.2, "square", 0.04);
  }

  hurt() {
    this.tone(90, 0.18, "sawtooth", 0.06);
  }
}
