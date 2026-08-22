import { FLOOR_Y, VIEW_H, VIEW_W, WALL_Y } from "./catalog";
import type { Engine } from "./engine";
import type { Enemy } from "./types";

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 3,
) {
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

export function drawWorld(g: Engine) {
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

function drawHallway(ctx: CanvasRenderingContext2D, cam: number) {
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
    VIEW_W * 0.62,
  );
  glow.addColorStop(0, "rgba(156,61,255,0.28)");
  glow.addColorStop(1, "rgba(156,61,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, FLOOR_Y);

  const lightShift = -((cam % 140) + 140);
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

  const gridShift = -((cam % 90) + 90);
  for (let x = gridShift; x < VIEW_W + 120; x += 90) {
    ctx.strokeStyle = "rgba(156,61,255,0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_Y);
    ctx.lineTo(x + 52, VIEW_H);
    ctx.stroke();
  }
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  d: { x: number; kind: string; open: number; label: string },
  shopLive: boolean,
) {
  const w = 96;
  const h = 210;
  const x = d.x - w / 2;
  const y = FLOOR_Y - h;
  ctx.fillStyle = "#07040d";
  ctx.fillRect(x - 8, y - 10, w + 16, h + 10);
  ctx.strokeStyle = d.kind === "shop" ? "#00ffd5" : "rgba(156,61,255,0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 8, y - 10, w + 16, h + 10);

  const leaf = (w / 2) * (1 - d.open);
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

function groundShadow(ctx: CanvasRenderingContext2D, x: number, w: number) {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(x, FLOOR_Y - 4, w, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Engine) {
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

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
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

function mixSkin(color: string) {
  if (color === "#ff7d78" || color === "#e35d6a") return "#c98a84";
  if (color === "#f2b7ff" || color === "#c9d2dc") return "#c9b4c4";
  return "#8fbfa8";
}
