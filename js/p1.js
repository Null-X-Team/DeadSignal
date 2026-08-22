window.__DS_SRC += `    for (let x = -((cam % 90) + 90); x < VIEW_W + 120; x += 90) {
      ctx.strokeStyle = "rgba(156,61,255,0.24)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 52, VIEW_H); ctx.stroke();
    }
  }

  function drawDoor(ctx, d, shopLive) {
    const w = 96, h = 210, x = d.x - w / 2, y = FLOOR_Y - h;
    ctx.fillStyle = "#07040d"; ctx.fillRect(x - 8, y - 10, w + 16, h + 10);
    ctx.strokeStyle = d.kind === "shop" ? "#00ffd5" : "rgba(156,61,255,0.7)";
    ctx.lineWidth = 3; ctx.strokeRect(x - 8, y - 10, w + 16, h + 10);
    const leaf = (w / 2) * (1 - d.open);
    ctx.fillStyle = d.kind === "shop" ? "#10241f" : "#1a1028";
    ctx.fillRect(x, y, leaf, h); ctx.fillRect(x + w - leaf, y, leaf, h);
    ctx.fillStyle = d.kind === "shop" && shopLive ? "#00ffd5" : "#a99fba";
    ctx.font = "700 11px Consolas, monospace"; ctx.textAlign = "center";
    ctx.fillText(d.label, d.x, y - 16);
    if (d.kind === "shop") {
      ctx.fillStyle = shopLive ? "#00ffd5" : "#3a2a52";
      ctx.fillRect(d.x - 6, y + h / 2, 4, 10);
    }
  }

  function groundShadow(ctx, x, w) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(x, FLOOR_Y - 4, w, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawPlayer(ctx, g) {
    const p = g.player, wpn = g.weapon();
    const moving = Math.abs(p.vx) > 12;
    const walk = moving ? Math.sin(p.step) : 0;
    const bob = moving ? Math.abs(Math.sin(p.step)) * 2.4 : 0;
    const hurt = p.hurt > 0;
    const skin = hurt ? "#e8a8ae" : "#d7c4b0";
    const suit = hurt ? "#ff8097" : "#d9cced";
    const shade = hurt ? "#8a3a42" : "#3b2a52";
    const boot = "#120816";
    groundShadow(ctx, p.x, 22);
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(p.facing, 1);
    ctx.save(); ctx.translate(-4, 8); ctx.rotate(walk * 0.58);
    ctx.fillStyle = shade; rr(ctx, -5, 0, 10, 20, 4);
    ctx.translate(0, 18); ctx.rotate(Math.max(0, -walk) * 0.28);
    rr(ctx, -4.5, 0, 9, 16, 3); ctx.fillStyle = boot; rr(ctx, -5, 13, 15, 6, 2); ctx.restore();
    ctx.save(); ctx.translate(5, 8); ctx.rotate(-walk * 0.58);
    ctx.fillStyle = "#5a4574"; rr(ctx, -5, 0, 10, 20, 4);
    ctx.translate(0, 18); ctx.rotate(Math.max(0, walk) * 0.28);
    rr(ctx, -4.5, 0, 9, 16, 3); ctx.fillStyle = boot; rr(ctx, -5, 13, 15, 6, 2); ctx.restore();
    ctx.save(); ctx.translate(-7, -18); ctx.rotate(-walk * 0.48 - 0.2);
    ctx.fillStyle = suit; rr(ctx, -4, 0, 8, 16, 3);
    ctx.translate(0, 14); ctx.rotate(-0.18); ctx.fillStyle = skin; rr(ctx, -3.5, 0, 7, 13, 3); ctx.restore();
    ctx.fillStyle = suit; rr(ctx, -12, -24, 26, 34, 6);
    ctx.fillStyle = "#1a1028"; rr(ctx, -8, -18, 18, 24, 4);
    ctx.fillStyle = wpn.color; ctx.fillRect(-8, -18, 3, 24);
    ctx.fillStyle = skin; rr(ctx, -8, -44, 18, 20, 7);
    ctx.fillStyle = "#0b0814"; rr(ctx, -10, -48, 22, 14, 6);
    ctx.fillStyle = wpn.color; ctx.globalAlpha = 0.9; rr(ctx, 1, -42, 11, 7, 2); ctx.globalAlpha = 1;
    ctx.fillStyle = "#2a1a40"; rr(ctx, -6, -36, 10, 4, 1);
    const lift = Math.max(-0.55, Math.min(0.5, p.aimLift));
    ctx.save(); ctx.translate(8, -16); ctx.rotate(lift);
    ctx.fillStyle = suit; rr(ctx, -3, -5, 22, 10, 4);
    ctx.fillStyle = skin; rr(ctx, 16, -4.5, 14, 9, 4);
    ctx.fillStyle = "#1a1028"; rr(ctx, 26, 2, 7, 11, 2);
    ctx.fillStyle = wpn.color; ctx.shadowColor = wpn.color; ctx.shadowBlur = 12;
    rr(ctx, 24, -7, 40, 11, 2); ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8f6ff"; rr(ctx, 60, -4, 16, 5, 1); ctx.restore();
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
    ctx.save(); ctx.translate(e.x, e.y + bob); ctx.scale(e.facing * s, s);
    ctx.save(); ctx.translate(-5, 10); ctx.rotate(walk * 0.7 + 0.12);
    ctx.fillStyle = dark; rr(ctx, -4.5, 0, 9, 18, 3);
    ctx.translate(0, 16); ctx.rotate(0.2); rr(ctx, -4, 0, 8, 14, 3);
    ctx.fillStyle = "#2a1a1c"; rr(ctx, -4, 12, 12, 5, 2); ctx.restore();
    ctx.save(); ctx.translate(5, 10); ctx.rotate(-walk * 0.7 - 0.08);
    ctx.fillStyle = "#2c2226"; rr(ctx, -4.5, 0, 9, 18, 3);
    ctx.translate(0, 16); ctx.rotate(0.15); rr(ctx, -4, 0, 8, 14, 3);
`;
