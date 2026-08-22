window.DeadSignalGame = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/game/engine.ts
  var engine_exports = {};
  __export(engine_exports, {
    Engine: () => Engine
  });

  // src/game/catalog.ts
  var VIEW_W = 1280;
  var VIEW_H = 720;
  var WORLD_W = 2920;
  var FLOOR_Y = 548;
  var WALL_Y = 118;
  var WEAPONS = [
    {
      id: "pistol",
      name: "Pulse Pistol",
      slot: "1",
      mag: 12,
      reserveStart: 72,
      damage: 34,
      fireRate: 0.21,
      reload: 0.92,
      speed: 1240,
      pellets: 1,
      spread: 0.022,
      color: "#7ee8d4",
      recoil: 3,
      cost: 0
    },
    {
      id: "scatter",
      name: "Scatter Blaster",
      slot: "2",
      mag: 6,
      reserveStart: 30,
      damage: 18,
      fireRate: 0.58,
      reload: 1.28,
      speed: 980,
      pellets: 6,
      spread: 0.22,
      color: "#d6dde8",
      recoil: 8,
      cost: 80
    },
    {
      id: "smg",
      name: "Needle SMG",
      slot: "3",
      mag: 24,
      reserveStart: 96,
      damage: 15,
      fireRate: 0.075,
      reload: 1.15,
      speed: 1180,
      pellets: 1,
      spread: 0.07,
      color: "#9ad7ff",
      recoil: 2,
      cost: 120
    },
    {
      id: "rail",
      name: "Rail Lance",
      slot: "4",
      mag: 4,
      reserveStart: 16,
      damage: 118,
      fireRate: 0.82,
      reload: 1.55,
      speed: 2300,
      pellets: 1,
      spread: 4e-3,
      color: "#f4f6f8",
      recoil: 11,
      cost: 180
    }
  ];
  var SHOP_ITEMS = [
    {
      id: "patch",
      name: "Field Patch",
      blurb: "Seal 40 vital points.",
      cost: 22,
      kind: "patch"
    },
    {
      id: "kit",
      name: "Trauma Kit",
      blurb: "Full vital restore.",
      cost: 48,
      kind: "patch"
    },
    {
      id: "ammo",
      name: "Mag Crate",
      blurb: "Reserve ammo for the held gun.",
      cost: 16,
      kind: "ammo"
    },
    {
      id: "scatter",
      name: "Scatter Blaster",
      blurb: "Wide pellet cone. Slot 2.",
      cost: 80,
      kind: "gun",
      weaponId: "scatter"
    },
    {
      id: "smg",
      name: "Needle SMG",
      blurb: "High cyclic fire. Slot 3.",
      cost: 120,
      kind: "gun",
      weaponId: "smg"
    },
    {
      id: "rail",
      name: "Rail Lance",
      blurb: "Armor-piercing beam. Slot 4.",
      cost: 180,
      kind: "gun",
      weaponId: "rail"
    }
  ];

  // src/game/audio.ts
  var Sfx = class {
    constructor() {
      __publicField(this, "ctx", null);
    }
    unlock() {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === "suspended") void this.ctx.resume();
    }
    tone(freq, dur, type, gain = 0.05) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur);
    }
    shoot(bright) {
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
  };

  // src/game/render.ts
  function rr(ctx, x, y, w, h, r = 3) {
    if (!(w > 0) || !(h > 0)) return;
    const rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      try {
        ctx.roundRect(x, y, w, h, rad);
      } catch {
        ctx.rect(x, y, w, h);
      }
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
  }
  function drawWorld(g) {
    const ctx = g.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    const shake = g.reduced ? 0 : g.trauma * g.trauma * 10;
    const ox = (Math.random() - 0.5) * shake;
    const oy = (Math.random() - 0.5) * shake;
    const cam = g.camX;
    ctx.save();
    ctx.translate(ox, oy);
    drawHallway(ctx, cam);
    ctx.restore();
    ctx.save();
    ctx.translate(ox - cam, oy);
    for (const d of g.doors) drawDoor(ctx, d, g.phase === "intermission");
    g.enemies.forEach((e) => drawEnemy(ctx, e));
    drawPlayer(ctx, g);
    for (const b of g.bullets) {
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.r;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
    if (g.player.kick > 0) {
      const pr = 1 - g.player.kick / 2.2;
      ctx.strokeStyle = `rgba(255,191,112,${1 - pr})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(g.player.x, g.player.y, pr * 190, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    if (g.flash > 0) {
      ctx.fillStyle = `rgba(180,90,255,${g.flash * 1.4})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (g.phase === "combat" || g.phase === "intermission") {
      const x = g.mouse.x;
      const y = g.mouse.y;
      ctx.strokeStyle = "rgba(0,255,213,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 16, y);
      ctx.lineTo(x - 5, y);
      ctx.moveTo(x + 5, y);
      ctx.lineTo(x + 16, y);
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x, y - 5);
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x, y + 16);
      ctx.stroke();
    }
  }
  function drawHallway(ctx, cam) {
    const wall = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    wall.addColorStop(0, "#06040b");
    wall.addColorStop(0.2, "#140a24");
    wall.addColorStop(0.48, "#2a1450");
    wall.addColorStop(0.76, "#160c28");
    wall.addColorStop(1, "#07050c");
    ctx.fillStyle = wall;
    ctx.fillRect(-30, -30, VIEW_W + 60, VIEW_H + 60);
    ctx.fillStyle = "#0a0712";
    ctx.fillRect(-30, -30, VIEW_W + 60, WALL_Y + 30);
    const glow = ctx.createRadialGradient(
      VIEW_W * 0.5,
      90,
      8,
      VIEW_W * 0.5,
      90,
      VIEW_W * 0.62
    );
    glow.addColorStop(0, "rgba(156,61,255,0.28)");
    glow.addColorStop(1, "rgba(156,61,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, VIEW_W, FLOOR_Y);
    const lightShift = -(cam % 140 + 140);
    for (let x = lightShift; x < VIEW_W + 160; x += 140) {
      ctx.fillStyle = "rgba(0,255,213,0.08)";
      ctx.fillRect(x, 68, 74, 8);
      ctx.fillStyle = "rgba(177,103,255,0.2)";
      ctx.fillRect(x + 20, WALL_Y + 14, 5, FLOOR_Y - WALL_Y - 14);
    }
    ctx.fillStyle = "#0e0918";
    ctx.fillRect(-30, FLOOR_Y, VIEW_W + 60, VIEW_H - FLOOR_Y + 30);
    ctx.strokeStyle = "rgba(0,255,213,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, FLOOR_Y);
    ctx.lineTo(VIEW_W + 30, FLOOR_Y);
    ctx.stroke();
    const gridShift = -(cam % 90 + 90);
    for (let x = gridShift; x < VIEW_W + 120; x += 90) {
      ctx.strokeStyle = "rgba(156,61,255,0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x + 52, VIEW_H);
      ctx.stroke();
    }
  }
  function drawDoor(ctx, d, shopLive) {
    const w = 96;
    const h = 210;
    const x = d.x - w / 2;
    const y = FLOOR_Y - h;
    ctx.fillStyle = "#07040d";
    ctx.fillRect(x - 8, y - 10, w + 16, h + 10);
    ctx.strokeStyle = d.kind === "shop" ? "#00ffd5" : "rgba(156,61,255,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 8, y - 10, w + 16, h + 10);
    const leaf = w / 2 * (1 - d.open);
    ctx.fillStyle = d.kind === "shop" ? "#10241f" : "#1a1028";
    ctx.fillRect(x, y, leaf, h);
    ctx.fillRect(x + w - leaf, y, leaf, h);
    ctx.fillStyle = d.kind === "shop" && shopLive ? "#00ffd5" : "#a99fba";
    ctx.font = "700 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(d.label, d.x, y - 16);
    if (d.kind === "shop") {
      ctx.fillStyle = shopLive ? "#00ffd5" : "#3a2a52";
      ctx.fillRect(d.x - 6, y + h / 2, 4, 10);
    }
  }
  function groundShadow(ctx, x, w) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y - 4, w, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawPlayer(ctx, g) {
    const p = g.player;
    const wpn = g.weapon();
    const moving = Math.abs(p.vx) > 12;
    const walk = moving ? Math.sin(p.step) : 0;
    const bob = moving ? Math.abs(Math.sin(p.step)) * 2.4 : 0;
    const hurt = p.hurt > 0;
    const skin = hurt ? "#e8a8ae" : "#d7c4b0";
    const suit = hurt ? "#ff8097" : "#d9cced";
    const shade = hurt ? "#8a3a42" : "#3b2a52";
    const boot = "#120816";
    groundShadow(ctx, p.x, 22);
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(p.facing, 1);
    ctx.save();
    ctx.translate(-4, 8);
    ctx.rotate(walk * 0.58);
    ctx.fillStyle = shade;
    rr(ctx, -5, 0, 10, 20, 4);
    ctx.translate(0, 18);
    ctx.rotate(Math.max(0, -walk) * 0.28);
    rr(ctx, -4.5, 0, 9, 16, 3);
    ctx.fillStyle = boot;
    rr(ctx, -5, 13, 15, 6, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(5, 8);
    ctx.rotate(-walk * 0.58);
    ctx.fillStyle = "#5a4574";
    rr(ctx, -5, 0, 10, 20, 4);
    ctx.translate(0, 18);
    ctx.rotate(Math.max(0, walk) * 0.28);
    rr(ctx, -4.5, 0, 9, 16, 3);
    ctx.fillStyle = boot;
    rr(ctx, -5, 13, 15, 6, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(-7, -18);
    ctx.rotate(-walk * 0.48 - 0.2);
    ctx.fillStyle = suit;
    rr(ctx, -4, 0, 8, 16, 3);
    ctx.translate(0, 14);
    ctx.rotate(-0.18);
    ctx.fillStyle = skin;
    rr(ctx, -3.5, 0, 7, 13, 3);
    ctx.restore();
    ctx.fillStyle = suit;
    rr(ctx, -12, -24, 26, 34, 6);
    ctx.fillStyle = "#1a1028";
    rr(ctx, -8, -18, 18, 24, 4);
    ctx.fillStyle = wpn.color;
    ctx.fillRect(-8, -18, 3, 24);
    ctx.fillStyle = skin;
    rr(ctx, -8, -44, 18, 20, 7);
    ctx.fillStyle = "#0b0814";
    rr(ctx, -10, -48, 22, 14, 6);
    ctx.fillStyle = wpn.color;
    ctx.globalAlpha = 0.9;
    rr(ctx, 1, -42, 11, 7, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#2a1a40";
    rr(ctx, -6, -36, 10, 4, 1);
    const lift = Math.max(-0.55, Math.min(0.5, p.aimLift));
    ctx.save();
    ctx.translate(8, -16);
    ctx.rotate(lift);
    ctx.fillStyle = suit;
    rr(ctx, -3, -5, 22, 10, 4);
    ctx.fillStyle = skin;
    rr(ctx, 16, -4.5, 14, 9, 4);
    ctx.fillStyle = "#1a1028";
    rr(ctx, 26, 2, 7, 11, 2);
    ctx.fillStyle = wpn.color;
    ctx.shadowColor = wpn.color;
    ctx.shadowBlur = 12;
    rr(ctx, 24, -7, 40, 11, 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8f6ff";
    rr(ctx, 60, -4, 16, 5, 1);
    ctx.restore();
    ctx.restore();
  }
  function drawEnemy(ctx, e) {
    const walk = Math.sin(e.step);
    const bob = Math.abs(walk) * (e.type === "brute" ? 1.2 : 2.6);
    const s = e.type === "brute" ? 1.28 : e.type === "runner" ? 0.86 : 1;
    const body = e.hit > 0 ? "#ffffff" : e.color;
    const dark = "#150a1c";
    const skin = e.hit > 0 ? "#ffe8e8" : mixSkin(e.color);
    const reach = e.type === "runner" ? 0.35 : 0.55;
    groundShadow(ctx, e.x, 16 * s);
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.scale(e.facing * s, s);
    ctx.save();
    ctx.translate(-5, 10);
    ctx.rotate(walk * 0.7 + 0.12);
    ctx.fillStyle = dark;
    rr(ctx, -4.5, 0, 9, 18, 3);
    ctx.translate(0, 16);
    ctx.rotate(0.2);
    rr(ctx, -4, 0, 8, 14, 3);
    ctx.fillStyle = "#2a1a1c";
    rr(ctx, -4, 12, 12, 5, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(5, 10);
    ctx.rotate(-walk * 0.7 - 0.08);
    ctx.fillStyle = "#2c2226";
    rr(ctx, -4.5, 0, 9, 18, 3);
    ctx.translate(0, 16);
    ctx.rotate(0.15);
    rr(ctx, -4, 0, 8, 14, 3);
    ctx.fillStyle = "#2a1a1c";
    rr(ctx, -4, 12, 12, 5, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(-8, -14);
    ctx.rotate(-walk * 0.4 + 0.5);
    ctx.fillStyle = body;
    rr(ctx, -4, 0, 8, 16, 4);
    ctx.translate(0, 14);
    ctx.rotate(0.4);
    ctx.fillStyle = skin;
    rr(ctx, -3.5, 0, 7, 14, 3);
    ctx.restore();
    ctx.fillStyle = body;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    rr(ctx, -13, -20, 26, 32, 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    rr(ctx, -8, -12, 16, 18, 4);
    ctx.fillStyle = skin;
    rr(ctx, -4, -42, 18, 20, 8);
    ctx.fillStyle = dark;
    rr(ctx, -2, -36, 16, 8, 3);
    ctx.fillStyle = "#ff4c70";
    rr(ctx, 6, -34, 5 + Math.sin(e.step * 2) * 1.2, 3, 1);
    rr(ctx, 12, -34, 4, 3, 1);
    if (e.type === "brute") {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -22, 28, 34);
    }
    ctx.save();
    ctx.translate(8, -12);
    ctx.rotate(-0.15 - reach + walk * 0.2);
    ctx.fillStyle = body;
    rr(ctx, -3, -4, 22, 9, 4);
    ctx.fillStyle = skin;
    rr(ctx, 16, -5, 16, 10, 4);
    ctx.fillStyle = dark;
    rr(ctx, 28, -6, 8, 12, 3);
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(e.x - e.r, e.y - e.r - 16, e.r * 2, 4);
    ctx.fillStyle = e.type === "brute" ? "#ff6868" : "#6dffc8";
    ctx.fillRect(e.x - e.r, e.y - e.r - 16, e.r * 2 * Math.max(0, e.hp / e.maxHp), 4);
  }
  function mixSkin(color) {
    if (color === "#ff7d78" || color === "#e35d6a") return "#c98a84";
    if (color === "#f2b7ff" || color === "#c9d2dc") return "#c9b4c4";
    return "#8fbfa8";
  }

  // src/game/engine.ts
  var rand = (a, b) => a + Math.random() * (b - a);
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  var Engine = class {
    constructor(canvas, onHud, onShop) {
      __publicField(this, "canvas");
      __publicField(this, "ctx");
      __publicField(this, "keys", /* @__PURE__ */ new Set());
      __publicField(this, "mouse", { x: 900, y: 360, down: false });
      __publicField(this, "last", 0);
      __publicField(this, "raf", 0);
      __publicField(this, "sfx", new Sfx());
      __publicField(this, "phase", "menu");
      __publicField(this, "score", 0);
      __publicField(this, "credits", 0);
      __publicField(this, "wave", 0);
      __publicField(this, "toSpawn", 0);
      __publicField(this, "spawnTimer", 0);
      __publicField(this, "rest", 0);
      __publicField(this, "flash", 0);
      __publicField(this, "trauma", 0);
      __publicField(this, "msg", "");
      __publicField(this, "msgT", 0);
      __publicField(this, "high", Number(localStorage.getItem("deadSignalHigh") || 0));
      __publicField(this, "camX", 0);
      __publicField(this, "id", 1);
      __publicField(this, "shopOpen", false);
      __publicField(this, "shopHint", false);
      __publicField(this, "buyNote", "");
      __publicField(this, "player", {
        x: 520,
        y: FLOOR_Y - 42,
        r: 28,
        hp: 100,
        max: 100,
        speed: 430,
        aim: 0,
        aimLift: 0,
        facing: 1,
        fire: 0,
        reload: 0,
        kick: 0,
        hurt: 0,
        step: 0,
        vx: 0
      });
      __publicField(this, "weapons", []);
      __publicField(this, "weaponIndex", 0);
      __publicField(this, "bullets", []);
      __publicField(this, "enemies", []);
      __publicField(this, "particles", []);
      __publicField(this, "doors", []);
      __publicField(this, "onHud");
      __publicField(this, "onShop");
      __publicField(this, "reduced", false);
      __publicField(this, "_unbind", () => {
      });
      __publicField(this, "loop", (t) => {
        const dt = Math.min(0.05, (t - this.last || 16) / 1e3);
        this.last = t;
        try {
          this.update(dt);
          const targetCam = clamp(this.player.x - VIEW_W * 0.42, 0, WORLD_W - VIEW_W);
          this.camX += (targetCam - this.camX) * (1 - Math.exp(-6 * dt));
          drawWorld(this);
        } catch (err) {
          console.error(err);
        }
        this.raf = requestAnimationFrame(this.loop);
      });
      this.canvas = canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      this.ctx = ctx;
      this.onHud = onHud;
      this.onShop = onShop;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.buildDoors();
      this.resetLoadout();
      this.bind();
      this.exposeQa();
      this.raf = requestAnimationFrame(this.loop);
      this.pushHud();
      window.__deadSignal = this;
    }
    buildDoors() {
      this.doors = [];
      this.doors.push({
        id: 0,
        x: 280,
        kind: "shop",
        open: 0,
        target: 0,
        label: "ARMORY"
      });
      let id = 1;
      for (let x = 560; x <= 2520; x += 280) {
        this.doors.push({
          id: id++,
          x,
          kind: "spawn",
          open: 0,
          target: 0,
          label: `BAY ${id - 1}`
        });
      }
    }
    resetLoadout() {
      this.weapons = WEAPONS.map((w) => ({
        ...w,
        ammo: w.mag,
        reserve: w.reserveStart,
        owned: w.id === "pistol"
      }));
      this.weaponIndex = 0;
    }
    bind() {
      const down = (e) => {
        this.keys.add(e.code);
        if (["Space", "ArrowLeft", "ArrowRight", "KeyB"].includes(
          e.code
        )) {
          e.preventDefault();
        }
        if (this.phase === "menu" && (e.code === "Enter" || e.code === "Space")) {
          this.startRun();
          return;
        }
        if (this.phase === "dead" && e.code === "Enter") {
          this.startRun();
          return;
        }
        if (e.code === "KeyR") this.beginReload();
        if (e.code === "Space") this.pulseKick();
        if (e.code === "Digit1") this.switchWeapon(0);
        if (e.code === "Digit2") this.switchWeapon(1);
        if (e.code === "Digit3") this.switchWeapon(2);
        if (e.code === "Digit4") this.switchWeapon(3);
        if (e.code === "KeyE" || e.code === "KeyB") this.toggleShop();
      };
      const up = (e) => this.keys.delete(e.code);
      const clear = () => this.keys.clear();
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", clear);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.keys.clear();
      });
      const point = (clientX, clientY) => {
        const r = this.canvas.getBoundingClientRect();
        return {
          x: (clientX - r.left) * VIEW_W / r.width,
          y: (clientY - r.top) * VIEW_H / r.height
        };
      };
      this.canvas.addEventListener("pointermove", (e) => {
        const p = point(e.clientX, e.clientY);
        this.mouse.x = p.x;
        this.mouse.y = p.y;
      });
      this.canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== void 0 && e.button !== 0) return;
        this.mouse.down = true;
        const p = point(e.clientX, e.clientY);
        this.mouse.x = p.x;
        this.mouse.y = p.y;
        this.canvas.setPointerCapture(e.pointerId);
      });
      const release = () => {
        this.mouse.down = false;
      };
      this.canvas.addEventListener("pointerup", release);
      this.canvas.addEventListener("pointercancel", release);
      this._unbind = () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
      };
    }
    destroy() {
      cancelAnimationFrame(this.raf);
      this._unbind();
    }
    holdKey(code, on) {
      if (on) this.keys.add(code);
      else this.keys.delete(code);
    }
    startRun() {
      this.sfx.unlock();
      this.phase = "combat";
      this.score = 0;
      this.credits = 0;
      this.wave = 0;
      this.toSpawn = 0;
      this.rest = 0;
      this.flash = 0;
      this.trauma = 0;
      this.shopOpen = false;
      this.onShop(false);
      this.bullets = [];
      this.enemies = [];
      this.particles = [];
      this.player.x = 520;
      this.player.y = FLOOR_Y - 42;
      this.player.hp = 100;
      this.player.fire = 0;
      this.player.reload = 0;
      this.player.kick = 0;
      this.player.hurt = 0;
      this.player.step = 0;
      this.player.facing = 1;
      this.player.aimLift = 0;
      this.resetLoadout();
      this.doors.forEach((d) => {
        d.open = 0;
        d.target = 0;
      });
      this.say("CONTAINMENT STARTED", 1.4);
      this.beginWave();
    }
    beginWave() {
      this.wave += 1;
      this.toSpawn = 6 + this.wave * 3;
      this.spawnTimer = 0.35;
      this.phase = "combat";
      this.shopOpen = false;
      this.onShop(false);
      this.sfx.wave();
      this.say(`WAVE ${this.wave}`, 1.15);
    }
    beginIntermission() {
      this.phase = "intermission";
      this.rest = 10;
      this.doors.forEach((d) => {
        d.target = d.kind === "shop" ? 1 : 0;
      });
      this.say("WAVE CLEAR \u2014 ARMORY OPEN", 2.2);
    }
    spawnFromDoor() {
      const bays = this.doors.filter((d) => d.kind === "spawn");
      const door = bays[Math.floor(Math.random() * bays.length)];
      door.target = 1;
      const roll = Math.random();
      let type = "signal";
      if (this.wave > 4 && roll > 0.82) type = "brute";
      else if (this.wave > 2 && roll > 0.64) type = "runner";
      const stats = type === "brute" ? { hp: 150, speed: 52, r: 40, damage: 18, color: "#e35d6a", score: 36 } : type === "runner" ? { hp: 40, speed: 138, r: 22, damage: 10, color: "#c9d2dc", score: 18 } : { hp: 70, speed: 78, r: 28, damage: 13, color: "#7ee8d4", score: 12 };
      this.enemies.push({
        id: this.id++,
        type,
        x: door.x,
        y: FLOOR_Y - (type === "brute" ? 52 : 42),
        vx: 0,
        vy: 0,
        r: stats.r,
        hp: stats.hp + this.wave * 4,
        maxHp: stats.hp + this.wave * 4,
        speed: stats.speed + this.wave * 2,
        damage: stats.damage,
        score: stats.score,
        color: stats.color,
        hit: 0,
        attack: 0,
        knock: 0,
        dead: false,
        doorId: door.id,
        facing: this.player.x >= door.x ? 1 : -1,
        step: Math.random() * 8
      });
    }
    weapon() {
      return this.weapons[this.weaponIndex];
    }
    switchWeapon(i) {
      if (this.player.reload > 0) return;
      const w = this.weapons[i];
      if (!w || !w.owned || i === this.weaponIndex) return;
      this.weaponIndex = i;
      this.say(w.name.toUpperCase(), 0.65);
    }
    beginReload() {
      const w = this.weapon();
      if (this.player.reload > 0) return;
      if (w.ammo >= w.mag || w.reserve <= 0) return;
      this.player.reload = w.reload;
      this.say("RELOADING", 0.5);
    }
    fire() {
      if (this.phase !== "combat" && this.phase !== "intermission") return;
      if (this.shopOpen) return;
      if (this.player.reload > 0 || this.player.fire > 0) return;
      const w = this.weapon();
      if (w.ammo <= 0) {
        this.beginReload();
        return;
      }
      w.ammo -= 1;
      this.player.fire = w.fireRate;
      this.flash = 0.05;
      this.trauma = Math.min(1, this.trauma + w.recoil * 0.04);
      this.sfx.shoot(w.id === "pistol" || w.id === "smg");
      const originX = this.player.x - this.camX;
      const originY = this.player.y - 16;
      const dx = this.mouse.x - originX;
      const dy = this.mouse.y - originY;
      if (Math.abs(dx) > 6) this.player.facing = dx < 0 ? -1 : 1;
      const localDx = Math.max(16, dx * this.player.facing);
      this.player.aimLift = Math.atan2(dy, localDx);
      const aim = Math.atan2(dy, dx === 0 ? this.player.facing : dx);
      this.player.aim = aim;
      const muzzleX = this.player.x + this.player.facing * 56;
      const muzzleY = this.player.y - 16 + this.player.aimLift * 26;
      for (let i = 0; i < w.pellets; i++) {
        const a = aim + rand(-w.spread, w.spread);
        this.bullets.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(a) * w.speed,
          vy: Math.sin(a) * w.speed,
          life: 0.7,
          damage: w.damage,
          color: w.color,
          r: w.pellets > 1 ? 3.5 : 5
        });
      }
      this.burst(muzzleX, muzzleY, w.color, 7, 110);
    }
    pulseKick() {
      if (this.phase !== "combat" || this.player.kick > 0 || this.shopOpen) return;
      this.player.kick = 2.2;
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.burst(this.player.x, this.player.y, "#e0b15a", 26, 240);
      this.say("PULSE KICK", 0.4);
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 175) {
          const f = (175 - d) / 175;
          e.vx += (e.x - this.player.x) / (d || 1) * 780 * f;
          e.knock = 0.3;
          e.hp -= 20;
          e.hit = 0.18;
          if (e.hp <= 0) this.kill(e);
        }
      }
    }
    hurt(n) {
      if (this.player.hurt > 0) return;
      this.player.hp = Math.max(0, this.player.hp - n);
      this.player.hurt = 0.32;
      this.trauma = Math.min(1, this.trauma + 0.5);
      this.sfx.hurt();
      this.burst(this.player.x, this.player.y, "#e35d6a", 14, 150);
      if (this.player.hp <= 0) this.die();
    }
    die() {
      this.phase = "dead";
      this.shopOpen = false;
      this.onShop(false);
      this.high = Math.max(this.high, this.score);
      localStorage.setItem("deadSignalHigh", String(this.high));
      this.say("SIGNAL LOST", 3);
    }
    kill(e) {
      if (e.dead) return;
      e.dead = true;
      this.score += e.score;
      this.credits += e.score;
      this.sfx.hit();
      this.burst(e.x, e.y, e.color, 16, 190);
      if (Math.random() < 0.16) {
        const w = this.weapon();
        w.reserve += w.id === "pistol" ? 6 : 3;
        this.say("+ AMMO", 0.35);
      }
    }
    burst(x, y, color, n, p) {
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x,
          y,
          vx: rand(-p, p),
          vy: rand(-p, p),
          life: rand(0.18, 0.52),
          max: 0.52,
          size: rand(2, 5),
          color
        });
      }
    }
    say(t, s) {
      this.msg = t;
      this.msgT = s;
    }
    nearShop() {
      const shop = this.doors[0];
      return Math.abs(this.player.x - shop.x) < 70 && this.phase === "intermission";
    }
    toggleShop() {
      if (this.phase === "intermission") {
        this.shopOpen = !this.shopOpen;
        this.onShop(this.shopOpen);
        if (this.shopOpen) this.say("ARMORY", 0.4);
        return;
      }
      if (this.phase === "combat" && this.nearShop()) {
        this.shopOpen = !this.shopOpen;
        this.onShop(this.shopOpen);
      }
    }
    closeShop() {
      this.shopOpen = false;
      this.onShop(false);
    }
    continueWaves() {
      this.closeShop();
      this.beginWave();
    }
    buy(item) {
      if (this.credits < item.cost) return "Not enough credits.";
      if (item.kind === "patch") {
        if (this.player.hp >= this.player.max) return "Vitals already sealed.";
        this.credits -= item.cost;
        this.player.hp = clamp(
          this.player.hp + (item.id === "kit" ? this.player.max : 40),
          0,
          this.player.max
        );
        this.sfx.buy();
        return "Patch applied.";
      }
      if (item.kind === "ammo") {
        const w = this.weapon();
        this.credits -= item.cost;
        w.reserve += w.mag * 2;
        this.sfx.buy();
        return `Reserve +${w.mag * 2}`;
      }
      if (item.kind === "gun" && item.weaponId) {
        const w = this.weapons.find((x) => x.id === item.weaponId);
        if (!w) return "Unknown weapon.";
        if (w.owned) return "Already in the rack.";
        this.credits -= item.cost;
        w.owned = true;
        w.ammo = w.mag;
        w.reserve = w.reserveStart;
        this.weaponIndex = this.weapons.findIndex((x) => x.id === w.id);
        this.sfx.buy();
        return `${w.name} issued.`;
      }
      return "";
    }
    update(dt) {
      if (this.msgT > 0) {
        this.msgT -= dt;
        if (this.msgT <= 0) this.msg = "";
      }
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
      this.flash = Math.max(0, this.flash - dt);
      this.player.fire = Math.max(0, this.player.fire - dt);
      this.player.hurt = Math.max(0, this.player.hurt - dt);
      this.player.kick = Math.max(0, this.player.kick - dt);
      this.doors.forEach((d) => {
        d.open += (d.target - d.open) * (1 - Math.exp(-8 * dt));
        if (d.kind === "spawn" && d.open > 0.95 && this.phase === "combat") {
          const still = this.enemies.some((e) => !e.dead && e.doorId === d.id && Math.abs(e.x - d.x) < 40);
          if (!still) d.target = 0;
        }
      });
      if (this.phase === "menu" || this.phase === "dead" || this.shopOpen) {
        this.pushHud();
        return;
      }
      if (this.player.reload > 0) {
        this.player.reload -= dt;
        if (this.player.reload <= 0) {
          const w = this.weapon();
          const need = w.mag - w.ammo;
          const load = Math.min(need, w.reserve);
          w.ammo += load;
          w.reserve -= load;
          this.say("RELOADED", 0.4);
        }
      }
      let mx = 0;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
      const pads = navigator.getGamepads?.() || [];
      for (const p of pads) {
        if (!p) continue;
        const ax = p.axes[0] || 0;
        if (Math.abs(ax) > 0.2) mx += ax;
        if (p.buttons[7]?.pressed) this.fire();
      }
      this.player.vx = mx * this.player.speed;
      this.player.x = clamp(this.player.x + mx * this.player.speed * dt, 80, WORLD_W - 80);
      this.player.y = FLOOR_Y - 42;
      this.player.step += Math.abs(mx) * dt * 12;
      if (mx < 0) this.player.facing = -1;
      else if (mx > 0) this.player.facing = 1;
      const ox = this.player.x - this.camX;
      const adx = this.mouse.x - ox;
      const ady = this.mouse.y - (this.player.y - 16);
      if (mx === 0 && Math.abs(adx) > 8) this.player.facing = adx < 0 ? -1 : 1;
      const localDx = Math.max(16, adx * this.player.facing);
      this.player.aimLift = Math.atan2(ady, localDx);
      this.player.aim = Math.atan2(ady, adx === 0 ? this.player.facing : adx);
      if (this.mouse.down) this.fire();
      if (this.phase === "combat") {
        if (this.toSpawn > 0) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            this.spawnFromDoor();
            this.toSpawn -= 1;
            this.spawnTimer = Math.max(0.22, 0.72 - this.wave * 0.035);
          }
        } else if (this.enemies.length === 0) {
          this.beginIntermission();
        }
      } else if (this.phase === "intermission") {
        this.rest -= dt;
        if (this.rest <= 0) this.beginWave();
      }
      for (const b of this.bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
      }
      this.bullets = this.bullets.filter(
        (b) => b.life > 0 && b.x > -40 && b.x < WORLD_W + 40 && b.y > -40 && b.y < VIEW_H + 40
      );
      for (const b of this.bullets) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          const hit = e.r + b.r;
          if (dx * dx + dy * dy < hit * hit) {
            e.hp -= b.damage;
            e.hit = 0.12;
            e.vx += Math.sign(b.vx) * 110;
            e.knock = 0.1;
            b.life = 0;
            this.burst(b.x, b.y, b.color, 5, 90);
            if (e.hp <= 0) this.kill(e);
            break;
          }
        }
      }
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = this.player.x - e.x;
        const dist = Math.abs(dx) || 1;
        e.attack = Math.max(0, e.attack - dt);
        e.hit = Math.max(0, e.hit - dt);
        e.knock = Math.max(0, e.knock - dt);
        const speed = e.speed * (e.knock > 0 ? 0.28 : 1);
        e.x += (Math.sign(dx) * speed + e.vx) * dt;
        e.y = FLOOR_Y - (e.type === "brute" ? 52 : 42);
        e.facing = dx >= 0 ? 1 : -1;
        e.step += dt * (e.type === "runner" ? 14 : e.type === "brute" ? 6 : 9);
        e.vx *= Math.pow(1e-3, dt);
        if (dist < e.r + this.player.r * 0.72 && e.attack <= 0) {
          this.hurt(e.damage);
          e.attack = 0.85;
          e.vx -= Math.sign(dx) * 220;
        }
      }
      this.enemies = this.enemies.filter((e) => !e.dead);
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      this.pushHud();
    }
    pushHud() {
      const w = this.weapon();
      this.onHud({
        hp: this.player.hp,
        maxHp: this.player.max,
        score: this.score,
        credits: this.credits,
        wave: this.wave,
        remaining: this.enemies.length + this.toSpawn,
        weaponName: w.name,
        slot: w.slot,
        ammo: w.ammo,
        reserve: w.reserve,
        reloadT: this.player.reload > 0 ? 1 - this.player.reload / w.reload : 0,
        kickT: this.player.kick,
        message: this.msg,
        phase: this.phase,
        nearShop: this.nearShop(),
        shopOpen: this.shopOpen,
        rest: this.rest,
        highScore: this.high,
        owned: {
          pistol: this.weapons[0].owned,
          scatter: this.weapons[1].owned,
          smg: this.weapons[2].owned,
          rail: this.weapons[3].owned
        },
        weaponIndex: this.weaponIndex
      });
    }
    shopItems() {
      return SHOP_ITEMS;
    }
    exposeQa() {
      window.__controlsTest = {
        getYaw: () => this.player.x,
        getSpeed: () => Math.abs(this.player.vx),
        getFacing: () => this.player.facing,
        setKeys: (codes) => {
          this.keys.clear();
          codes.forEach((c) => this.keys.add(c));
        }
      };
    }
  };
  return __toCommonJS(engine_exports);
})();
