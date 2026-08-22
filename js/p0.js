window.__DS_SRC = `(() => {
  const VIEW_W = 1280, VIEW_H = 720, WORLD_W = 2920, FLOOR_Y = 548, WALL_Y = 118;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const WEAPONS = [
    { id: "pistol", name: "Pulse Pistol", slot: "1", mag: 12, reserveStart: 72, damage: 34, fireRate: 0.21, reload: 0.92, speed: 1240, pellets: 1, spread: 0.022, color: "#00ffd5", recoil: 3, cost: 0 },
    { id: "scatter", name: "Scatter Blaster", slot: "2", mag: 6, reserveStart: 30, damage: 18, fireRate: 0.58, reload: 1.28, speed: 980, pellets: 6, spread: 0.22, color: "#c58aff", recoil: 8, cost: 80 },
    { id: "smg", name: "Needle SMG", slot: "3", mag: 24, reserveStart: 96, damage: 15, fireRate: 0.075, reload: 1.15, speed: 1180, pellets: 1, spread: 0.07, color: "#9ad7ff", recoil: 2, cost: 120 },
    { id: "rail", name: "Rail Lance", slot: "4", mag: 4, reserveStart: 16, damage: 118, fireRate: 0.82, reload: 1.55, speed: 2300, pellets: 1, spread: 0.004, color: "#f7f3ff", recoil: 11, cost: 180 },
  ];
  const SHOP_ITEMS = [
    { id: "patch", name: "Field Patch", blurb: "Seal 40 vital points.", cost: 22, kind: "patch" },
    { id: "kit", name: "Trauma Kit", blurb: "Full vital restore.", cost: 48, kind: "patch" },
    { id: "ammo", name: "Mag Crate", blurb: "Reserve ammo for the held gun.", cost: 16, kind: "ammo" },
    { id: "scatter", name: "Scatter Blaster", blurb: "Wide pellet cone. Slot 2.", cost: 80, kind: "gun", weaponId: "scatter" },
    { id: "smg", name: "Needle SMG", blurb: "High cyclic fire. Slot 3.", cost: 120, kind: "gun", weaponId: "smg" },
    { id: "rail", name: "Rail Lance", blurb: "Armor-piercing beam. Slot 4.", cost: 180, kind: "gun", weaponId: "rail" },
  ];

  class Sfx {
    constructor() { this.ctx = null; }
    unlock() {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === "suspended") void this.ctx.resume();
    }
    tone(freq, dur, type, gain) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur);
    }
    shoot(bright) { this.tone(bright ? 880 : 420, 0.07, "square", 0.04); this.tone(bright ? 220 : 140, 0.09, "sawtooth", 0.03); }
    hit() { this.tone(180, 0.08, "triangle", 0.05); }
    buy() { this.tone(520, 0.08, "sine", 0.05); this.tone(780, 0.12, "sine", 0.04); }
    wave() { this.tone(220, 0.2, "square", 0.04); }
    hurt() { this.tone(90, 0.18, "sawtooth", 0.06); }
  }

  function rr(ctx, x, y, w, h, r) {
    if (!(w > 0) || !(h > 0)) return;
    const rad = Math.max(0, Math.min(r == null ? 3 : r, w / 2, h / 2));
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      try { ctx.roundRect(x, y, w, h, rad); } catch (e) { ctx.rect(x, y, w, h); }
    } else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  function mixSkin(color) {
    if (color === "#ff7d78" || color === "#e35d6a") return "#c98a84";
    if (color === "#f2b7ff" || color === "#c9d2dc") return "#c9b4c4";
    return "#8fbfa8";
  }

  function drawHallway(ctx, cam) {
    const wall = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    wall.addColorStop(0, "#06040b"); wall.addColorStop(0.2, "#140a24");
    wall.addColorStop(0.48, "#2a1450"); wall.addColorStop(0.76, "#160c28"); wall.addColorStop(1, "#07050c");
    ctx.fillStyle = wall; ctx.fillRect(-30, -30, VIEW_W + 60, VIEW_H + 60);
    ctx.fillStyle = "#0a0712"; ctx.fillRect(-30, -30, VIEW_W + 60, WALL_Y + 30);
    const glow = ctx.createRadialGradient(VIEW_W * 0.5, 90, 8, VIEW_W * 0.5, 90, VIEW_W * 0.62);
    glow.addColorStop(0, "rgba(156,61,255,0.28)"); glow.addColorStop(1, "rgba(156,61,255,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, VIEW_W, FLOOR_Y);
    for (let x = -((cam % 140) + 140); x < VIEW_W + 160; x += 140) {
      ctx.fillStyle = "rgba(0,255,213,0.08)"; ctx.fillRect(x, 68, 74, 8);
      ctx.fillStyle = "rgba(177,103,255,0.2)"; ctx.fillRect(x + 20, WALL_Y + 14, 5, FLOOR_Y - WALL_Y - 14);
    }
    ctx.fillStyle = "#0e0918"; ctx.fillRect(-30, FLOOR_Y, VIEW_W + 60, VIEW_H - FLOOR_Y + 30);
    ctx.strokeStyle = "rgba(0,255,213,0.28)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-30, FLOOR_Y); ctx.lineTo(VIEW_W + 30, FLOOR_Y); ctx.stroke();
`;
