window.__DS_SRC += `    ctx.fillStyle = "#2a1a1c"; rr(ctx, -4, 12, 12, 5, 2); ctx.restore();
    ctx.save(); ctx.translate(-8, -14); ctx.rotate(-walk * 0.4 + 0.5);
    ctx.fillStyle = body; rr(ctx, -4, 0, 8, 16, 4);
    ctx.translate(0, 14); ctx.rotate(0.4); ctx.fillStyle = skin; rr(ctx, -3.5, 0, 7, 14, 3); ctx.restore();
    ctx.fillStyle = body; ctx.shadowColor = e.color; ctx.shadowBlur = 10;
    rr(ctx, -13, -20, 26, 32, 8); ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.28)"; rr(ctx, -8, -12, 16, 18, 4);
    ctx.fillStyle = skin; rr(ctx, -4, -42, 18, 20, 8);
    ctx.fillStyle = dark; rr(ctx, -2, -36, 16, 8, 3);
    ctx.fillStyle = "#ff4c70";
    rr(ctx, 6, -34, 5 + Math.sin(e.step * 2) * 1.2, 3, 1); rr(ctx, 12, -34, 4, 3, 1);
    if (e.type === "brute") { ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2; ctx.strokeRect(-14, -22, 28, 34); }
    ctx.save(); ctx.translate(8, -12); ctx.rotate(-0.15 - reach + walk * 0.2);
    ctx.fillStyle = body; rr(ctx, -3, -4, 22, 9, 4);
    ctx.fillStyle = skin; rr(ctx, 16, -5, 16, 10, 4);
    ctx.fillStyle = dark; rr(ctx, 28, -6, 8, 12, 3); ctx.restore();
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(e.x - e.r, e.y - e.r - 16, e.r * 2, 4);
    ctx.fillStyle = e.type === "brute" ? "#ff6868" : "#6dffc8";
    ctx.fillRect(e.x - e.r, e.y - e.r - 16, e.r * 2 * Math.max(0, e.hp / e.maxHp), 4);
  }

  function drawWorld(g) {
    const ctx = g.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = "rgba(0,0,0,0)";
    const shake = g.reduced ? 0 : g.trauma * g.trauma * 10;
    const ox = (Math.random() - 0.5) * shake, oy = (Math.random() - 0.5) * shake;
    const cam = g.camX || 0;
    ctx.save(); ctx.translate(ox, oy); drawHallway(ctx, cam); ctx.restore();
    ctx.save(); ctx.translate(ox - cam, oy);
    g.doors.forEach((d) => drawDoor(ctx, d, g.phase === "intermission"));
    g.enemies.forEach((e) => drawEnemy(ctx, e));
    drawPlayer(ctx, g);
    g.bullets.forEach((b) => {
      ctx.strokeStyle = b.color; ctx.lineWidth = b.r; ctx.shadowColor = b.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.shadowBlur = 0;
    });
    g.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
    });
    if (g.player.kick > 0) {
      const pr = 1 - g.player.kick / 2.2;
      ctx.strokeStyle = "rgba(255,191,112," + (1 - pr) + ")"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(g.player.x, g.player.y, pr * 190, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = "rgba(180,90,255," + g.flash * 1.4 + ")"; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (g.phase === "combat" || g.phase === "intermission") {
      const x = g.mouse.x, y = g.mouse.y;
      ctx.strokeStyle = "rgba(0,255,213,.75)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 16, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 16, y);
      ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 16); ctx.stroke();
    }
  }

  class Engine {
    constructor(canvas, onHud, onShop) {
      this.canvas = canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      this.ctx = ctx; this.keys = new Set();
      this.mouse = { x: 900, y: 360, down: false };
      this.last = 0; this.raf = 0; this.sfx = new Sfx();
      this.phase = "menu"; this.score = 0; this.credits = 0; this.wave = 0;
      this.toSpawn = 0; this.spawnTimer = 0; this.rest = 0; this.flash = 0; this.trauma = 0;
      this.msg = ""; this.msgT = 0;
      this.high = Number(localStorage.getItem("deadSignalHigh") || 0);
      this.camX = 0; this.id = 1; this.shopOpen = false;
      this.onHud = onHud; this.onShop = onShop;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.player = { x: 520, y: FLOOR_Y - 42, r: 28, hp: 100, max: 100, speed: 430, aim: 0, aimLift: 0, facing: 1, fire: 0, reload: 0, kick: 0, hurt: 0, step: 0, vx: 0 };
      this.weapons = []; this.weaponIndex = 0; this.bullets = []; this.enemies = []; this.particles = []; this.doors = [];
      this.buildDoors(); this.resetLoadout(); this.bind();
`;
