import { SHOP_ITEMS, VIEW_H, VIEW_W, WEAPONS, WORLD_W, FLOOR_Y } from "./catalog";
import { Sfx } from "./audio";
import type {
  Bullet,
  Door,
  Enemy,
  HudSnap,
  Particle,
  Phase,
  ShopItem,
  WeaponId,
  WeaponState,
} from "./types";
import { drawWorld } from "./render";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  keys = new Set<string>();
  mouse = { x: 900, y: 360, down: false };
  last = 0;
  raf = 0;
  sfx = new Sfx();
  phase: Phase = "menu";
  score = 0;
  credits = 0;
  wave = 0;
  toSpawn = 0;
  spawnTimer = 0;
  rest = 0;
  flash = 0;
  trauma = 0;
  msg = "";
  msgT = 0;
  high = Number(localStorage.getItem("deadSignalHigh") || 0);
  camX = 0;
  id = 1;
  shopOpen = false;
  shopHint = false;
  buyNote = "";

  player = {
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
    vx: 0,
  };

  weapons: WeaponState[] = [];
  weaponIndex = 0;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  doors: Door[] = [];
  onHud: (h: HudSnap) => void;
  onShop: (open: boolean) => void;
  reduced = false;

  constructor(
    canvas: HTMLCanvasElement,
    onHud: (h: HudSnap) => void,
    onShop: (open: boolean) => void,
  ) {
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
      label: "ARMORY",
    });
    let id = 1;
    for (let x = 560; x <= 2520; x += 280) {
      this.doors.push({
        id: id++,
        x,
        kind: "spawn",
        open: 0,
        target: 0,
        label: `BAY ${id - 1}`,
      });
    }
  }

  resetLoadout() {
    this.weapons = WEAPONS.map((w) => ({
      ...w,
      ammo: w.mag,
      reserve: w.reserveStart,
      owned: w.id === "pistol",
    }));
    this.weaponIndex = 0;
  }

  bind() {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (
        ["Space", "ArrowLeft", "ArrowRight", "KeyB"].includes(
          e.code,
        )
      ) {
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
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.keys.clear();
    });

    const point = (clientX: number, clientY: number) => {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: ((clientX - r.left) * VIEW_W) / r.width,
        y: ((clientY - r.top) * VIEW_H) / r.height,
      };
    };

    this.canvas.addEventListener("pointermove", (e) => {
      const p = point(e.clientX, e.clientY);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
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

  _unbind = () => {};

  destroy() {
    cancelAnimationFrame(this.raf);
    this._unbind();
  }

  holdKey(code: string, on: boolean) {
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
    this.say("WAVE CLEAR — ARMORY OPEN", 2.2);
  }

  spawnFromDoor() {
    const bays = this.doors.filter((d) => d.kind === "spawn");
    const door = bays[Math.floor(Math.random() * bays.length)];
    door.target = 1;
    const roll = Math.random();
    let type: Enemy["type"] = "signal";
    if (this.wave > 4 && roll > 0.82) type = "brute";
    else if (this.wave > 2 && roll > 0.64) type = "runner";

    const stats =
      type === "brute"
        ? { hp: 150, speed: 52, r: 40, damage: 18, color: "#e35d6a", score: 36 }
        : type === "runner"
          ? { hp: 40, speed: 138, r: 22, damage: 10, color: "#c9d2dc", score: 18 }
          : { hp: 70, speed: 78, r: 28, damage: 13, color: "#7ee8d4", score: 12 };

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
      step: Math.random() * 8,
    });
  }

  weapon() {
    return this.weapons[this.weaponIndex];
  }

  switchWeapon(i: number) {
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
        r: w.pellets > 1 ? 3.5 : 5,
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
        e.vx += ((e.x - this.player.x) / (d || 1)) * 780 * f;
        e.knock = 0.3;
        e.hp -= 20;
        e.hit = 0.18;
        if (e.hp <= 0) this.kill(e);
      }
    }
  }

  hurt(n: number) {
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

  kill(e: Enemy) {
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

  burst(x: number, y: number, color: string, n: number, p: number) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x,
        y,
        vx: rand(-p, p),
        vy: rand(-p, p),
        life: rand(0.18, 0.52),
        max: 0.52,
        size: rand(2, 5),
        color,
      });
    }
  }

  say(t: string, s: number) {
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

  buy(item: ShopItem): string {
    if (this.credits < item.cost) return "Not enough credits.";
    if (item.kind === "patch") {
      if (this.player.hp >= this.player.max) return "Vitals already sealed.";
      this.credits -= item.cost;
      this.player.hp = clamp(
        this.player.hp + (item.id === "kit" ? this.player.max : 40),
        0,
        this.player.max,
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

  update(dt: number) {
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
      (b) => b.life > 0 && b.x > -40 && b.x < WORLD_W + 40 && b.y > -40 && b.y < VIEW_H + 40,
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
      e.vx *= Math.pow(0.001, dt);
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

  loop = (t: number) => {
    const dt = Math.min(0.05, (t - this.last || 16) / 1000);
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
  };

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
        rail: this.weapons[3].owned,
      },
      weaponIndex: this.weaponIndex,
    });
  }

  shopItems(): ShopItem[] {
    return SHOP_ITEMS;
  }

  exposeQa() {
    window.__controlsTest = {
      getYaw: () => this.player.x,
      getSpeed: () => Math.abs(this.player.vx),
      getFacing: () => this.player.facing,
      setKeys: (codes: string[]) => {
        this.keys.clear();
        codes.forEach((c) => this.keys.add(c));
      },
    };
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getFacing?: () => number;
      setKeys?: (codes: string[]) => void;
    };
    __deadSignal?: Engine;
  }
}
