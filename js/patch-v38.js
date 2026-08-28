// DeadSignal v38 — fix credits + force ragdoll/block/RPG + menu lock
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

  function lockMenu() {
    try {
      var k = document.getElementById("menu-kicker");
      var c = document.getElementById("menu-copy");
      var tag = document.getElementById("build-tag");
      if (k && /BUILD v3[0-7]/i.test(k.textContent || "")) k.textContent = "Null X Interactive · BUILD v38";
      if (tag) tag.textContent = "BUILD v38 — ragdoll · gore · RPG · credits fix";
      if (c && /facility hallway/i.test(c.textContent || ""))
        c.textContent = "Ragdoll · gore · RPG-7 · skill tree. Q cycle · E hatchet · ESC pause.";
    } catch (e) {}
  }
  setInterval(lockMenu, 400);
  lockMenu();

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function ensureRpg(eng) {
    if (!eng || !eng.weapons) return;
    if (eng.weapons.some(function (w) { return w.id === "rpg"; })) return;
    eng.weapons.push({
      id: "rpg", name: "RPG-7", slot: "R", mag: 1, reserveStart: 6,
      damage: 240, fireRate: 1.35, reload: 2.2, speed: 500, pellets: 1,
      spread: 0.012, color: "#ff6a3a", recoil: 16, cost: 320, kind: "gun",
      hold: "rifle", reloadAnim: "tube", pierce: false, explosive: true,
      blast: 120, owned: false
    });
  }

  var _shop = proto.shopItems;
  if (_shop) {
    proto.shopItems = function () {
      ensureRpg(this);
      var items = _shop.call(this) || [];
      if (!items.some(function (it) { return it.weaponId === "rpg" || it.id === "rpg"; })) {
        items.push({ kind: "gun", weaponId: "rpg", id: "rpg", name: "RPG-7", cost: 320, blurb: "Explosive rocket. Huge blast." });
      }
      return items;
    };
  }

  var _start = proto.startRun;
  proto.startRun = function () {
    ensureRpg(this);
    _start.call(this);
    ensureRpg(this);
  };

  // Score/credits FIRST, then ragdoll (old bug set dead early and skipped rewards)
  var chainKill = proto.kill;
  proto.kill = function (e) {
    if (!e || e.dead) return;
    chainKill.call(this, e);
    if (!e.parts) {
      e.ragdoll = true;
      e.parts = buildParts(e, (Math.random() - 0.5) * 220, -140 - Math.random() * 120);
      e.corpseLife = Math.max(e.corpseLife || 0, 6);
    }
    spawnGore(this, e, e.x, e.y - 8, 14);
  };

  function buildParts(e, ix, iy) {
    var s = e.sizeScale || 1;
    var parts = [
      { name: "torso", x: e.x, y: e.y - 10 * s, vx: ix * 0.25, vy: iy * 0.3, w: 26 * s, h: 30 * s, rot: 0, vr: (Math.random() - 0.5) * 8, color: e.color, life: 6 },
      { name: "head", x: e.x + (Math.random() - 0.5) * 10, y: e.y - 34 * s, vx: ix * 0.5, vy: iy * 0.55, w: 15 * s, h: 15 * s, rot: 0, vr: (Math.random() - 0.5) * 12, color: "#c4a090", life: 6 }
    ];
    if (e.noHead) parts.pop();
    if (!e.noArmL) parts.push({ name: "arm", x: e.x - 14 * s, y: e.y - 6 * s, vx: -80, vy: -50, w: 8 * s, h: 16 * s, rot: 0, vr: 5, color: e.color, life: 5 });
    if (!e.noArmR) parts.push({ name: "arm", x: e.x + 14 * s, y: e.y - 6 * s, vx: 80, vy: -50, w: 8 * s, h: 16 * s, rot: 0, vr: -5, color: e.color, life: 5 });
    parts.push({ name: "leg", x: e.x - 6 * s, y: e.y + 14 * s, vx: -30, vy: -10, w: 9 * s, h: 18 * s, rot: e.brokenL ? 1.1 : 0, vr: 2, color: "#1a1018", life: 5 });
    parts.push({ name: "leg", x: e.x + 6 * s, y: e.y + 14 * s, vx: 30, vy: -10, w: 9 * s, h: 18 * s, rot: e.brokenR ? -1.1 : 0, vr: -2, color: "#1a1018", life: 5 });
    return parts;
  }

  function spawnGore(eng, e, hx, hy, n) {
    if (!eng.particles) eng.particles = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 170;
      eng.particles.push({ x: hx, y: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life: 0.5 + Math.random() * 0.6, max: 1.1, size: 2 + Math.random() * 5, color: Math.random() < 0.35 ? "#4a0810" : "#8a1020", gore: true });
    }
    if (!e.holes) e.holes = [];
    e.holes.push({ x: (hx - e.x) * (e.facing || 1), y: hy - e.y, r: 3 + Math.random() * 5 });
    if (e.holes.length > 16) e.holes.shift();
  }

  var chainFire = proto.fire;
  if (chainFire) {
    proto.fire = function () {
      var w = this.weapon && this.weapon();
      var before = this.bullets ? this.bullets.length : 0;
      chainFire.call(this);
      if (w && w.explosive && this.bullets) {
        for (var i = before; i < this.bullets.length; i++) {
          this.bullets[i].explosive = true;
          this.bullets[i].blast = w.blast || 120;
          this.bullets[i].r = 8;
          this.bullets[i].color = "#ff6a3a";
        }
      }
    };
  }

  function explode(eng, x, y, radius, dmg) {
    eng.burst && eng.burst(x, y, "#ff6a3a", 30, 300);
    eng.burst && eng.burst(x, y, "#8a1020", 16, 180);
    eng.flash = Math.max(eng.flash || 0, 0.4);
    eng.trauma = Math.min(1, (eng.trauma || 0) + 0.45);
    if (!eng.enemies) return;
    for (var i = 0; i < eng.enemies.length; i++) {
      var e = eng.enemies[i];
      if (e.dead) continue;
      var dx = e.x - x, dy = e.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      var f = 1 - dist / radius;
      e.hp -= dmg * f;
      spawnGore(eng, e, e.x, e.y, 10);
      if (Math.random() < 0.5 * f) e.brokenL = true;
      if (Math.random() < 0.5 * f) e.brokenR = true;
      if (e.hp <= 0) eng.kill(e);
    }
  }

  var chainUpdate = proto.update;
  proto.update = function (dt) {
    if (this.phase === "combat" && this.enemies && this.player) {
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.dead) continue;
        var aimY = this.mouse ? this.mouse.y : e.y - 30;
        var nearFace = Math.abs(aimY - (e.y - (e.r || 24) * 1.15)) < 32 && Math.abs((this.player.x || 0) - e.x) < 480;
        if (nearFace && Math.random() < 0.025) e.blocking = 0.75 + Math.random() * 0.4;
        if (e.blocking > 0) e.blocking -= dt;
      }
    }
    chainUpdate.call(this, dt);
    if (this.enemies) {
      for (var ri = 0; ri < this.enemies.length; ri++) {
        var z = this.enemies[ri];
        if (!z.parts) continue;
        for (var pi = 0; pi < z.parts.length; pi++) {
          var p = z.parts[pi];
          p.vy += 980 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt; p.vx *= 0.991;
          if (p.y + (p.h || 10) * 0.5 > FLOOR_Y) {
            p.y = FLOOR_Y - (p.h || 10) * 0.5; p.vy *= -0.32; p.vx *= 0.65; p.vr = (p.vr || 0) * 0.55;
            if (Math.abs(p.vy) < 28) p.vy = 0;
          }
          p.life -= dt;
        }
        z.parts = z.parts.filter(function (p) { return p.life > 0; });
      }
    }
    if (this.particles) {
      for (var gi = 0; gi < this.particles.length; gi++) {
        var gp = this.particles[gi];
        if (!gp.gore) continue;
        gp.vy += 650 * dt;
        if (gp.y > FLOOR_Y) { gp.y = FLOOR_Y; gp.vy *= -0.15; gp.vx *= 0.5; }
      }
    }
    if (this.bullets) {
      for (var bi = 0; bi < this.bullets.length; bi++) {
        var b = this.bullets[bi];
        if (!b.explosive) continue;
        if (b.y >= FLOOR_Y - 10) { explode(this, b.x, FLOOR_Y - 4, b.blast || 120, b.damage || 200); b.life = 0; continue; }
        if (!this.enemies) continue;
        for (var ei = 0; ei < this.enemies.length; ei++) {
          var en = this.enemies[ei];
          if (en.dead) continue;
          var dx = b.x - en.x, dy = b.y - en.y, rr2 = (en.r || 22) + 10;
          if (dx * dx + dy * dy < rr2 * rr2) { explode(this, b.x, b.y, b.blast || 120, b.damage || 200); b.life = 0; break; }
        }
      }
    }
    if (this.bullets && this.enemies && this.phase === "combat") {
      for (var bj = 0; bj < this.bullets.length; bj++) {
        var bb = this.bullets[bj];
        if (bb.explosive) continue;
        for (var ej = 0; ej < this.enemies.length; ej++) {
          var ez = this.enemies[ej];
          if (ez.dead) continue;
          var ddx = bb.x - ez.x, ddy = bb.y - ez.y, hit = (ez.r || 22) + (bb.r || 4);
          if (ddx * ddx + ddy * ddy > hit * hit * 2.2) continue;
          var headY = ez.y - (ez.r || 22) * 1.15;
          var toFace = Math.abs(bb.y - headY) < 20 && Math.abs(ddx) < (ez.r || 22) * 0.75;
          if (toFace && ez.blocking > 0) {
            ez.blocking -= 0.2; bb.life = 0;
            this.burst && this.burst(ez.x, headY, "#c9d2dc", 7, 100);
            this.say("BLOCKED", 0.3);
            continue;
          }
          if (toFace && Math.random() < 0.4) ez.blocking = 0.6;
          spawnGore(this, ez, bb.x, bb.y, 4);
          if (bb.y > ez.y + 4 && Math.random() < 0.22) {
            if (ddx * (ez.facing || 1) < 0) ez.brokenL = true; else ez.brokenR = true;
          }
        }
      }
    }
  };

  var chainDraw = proto.draw;
  proto.draw = function (ctx) {
    chainDraw.call(this, ctx);
    try {
      if (!this.enemies) return;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.parts && e.parts.length) {
          for (var j = 0; j < e.parts.length; j++) {
            var p = e.parts[j];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot || 0);
            ctx.globalAlpha = Math.max(0.2, Math.min(1, p.life / 2));
            ctx.fillStyle = p.color || e.color;
            rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 3);
            if (p.name === "head") { ctx.fillStyle = "#150a1c"; rr(ctx, -p.w * 0.25, -p.h * 0.2, p.w * 0.65, p.h * 0.3, 2); }
            ctx.fillStyle = "#8a1020";
            rr(ctx, -p.w * 0.15, 0, p.w * 0.3, p.h * 0.2, 2);
            ctx.restore();
          }
        }
        if (e.dead) continue;
        if (e.holes) {
          ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing || 1, 1);
          for (var h = 0; h < e.holes.length; h++) {
            var hole = e.holes[h];
            ctx.fillStyle = "#2a0508"; ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#8a1020"; ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r * 0.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
        if (e.blocking > 0) {
          var sc = e.sizeScale || 1;
          ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing || 1, 1);
          ctx.fillStyle = e.color;
          rr(ctx, 2 * sc, -42 * sc, 11 * sc, 18 * sc, 3);
          rr(ctx, -10 * sc, -40 * sc, 11 * sc, 16 * sc, 3);
          ctx.fillStyle = "#c4a090";
          rr(ctx, 4 * sc, -48 * sc, 9 * sc, 9 * sc, 3);
          rr(ctx, -8 * sc, -46 * sc, 9 * sc, 9 * sc, 3);
          ctx.restore();
        }
      }
    } catch (err) {}
  };

  console.log("[DeadSignal] v38 credits+ragdoll+block+RPG fix");
})();
