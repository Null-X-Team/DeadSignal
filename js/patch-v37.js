// DeadSignal v37 — ragdoll, face block, dismember, gore holes, RPG
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

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
      id: "rpg", name: "RPG-7", slot: "R", mag: 1, reserveStart: 4,
      damage: 220, fireRate: 1.4, reload: 2.4, speed: 520, pellets: 1,
      spread: 0.01, color: "#ff6a3a", recoil: 14, cost: 350, kind: "gun",
      hold: "rifle", reloadAnim: "tube", pierce: false, explosive: true,
      blast: 110, owned: false
    });
  }

  var _start = proto.startRun;
  proto.startRun = function () {
    _start.call(this);
    ensureRpg(this);
  };

  var _fire = proto.fire;
  if (_fire) {
    proto.fire = function () {
      var w = this.weapon && this.weapon();
      var before = this.bullets ? this.bullets.length : 0;
      _fire.call(this);
      if (!w || !w.explosive) return;
      for (var i = before; i < this.bullets.length; i++) {
        this.bullets[i].explosive = true;
        this.bullets[i].blast = w.blast || 100;
        this.bullets[i].r = 7;
        this.bullets[i].color = "#ff6a3a";
      }
    };
  }

  function explode(eng, x, y, radius, dmg) {
    eng.burst && eng.burst(x, y, "#ff6a3a", 28, 280);
    eng.burst && eng.burst(x, y, "#8a1020", 18, 200);
    eng.flash = Math.max(eng.flash || 0, 0.35);
    eng.trauma = Math.min(1, (eng.trauma || 0) + 0.4);
    if (!eng.enemies) return;
    for (var i = 0; i < eng.enemies.length; i++) {
      var e = eng.enemies[i];
      if (e.dead) continue;
      var dx = e.x - x, dy = e.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      var falloff = 1 - dist / radius;
      e.hp -= dmg * falloff;
      e.hit = 0.3;
      e.vx = (dx || 1) / (dist || 1) * 280 * falloff;
      e.vy = -180 * falloff - 40;
      spawnGore(eng, e, x, y, 12);
      if (Math.random() < 0.55 * falloff) e.brokenL = true;
      if (Math.random() < 0.55 * falloff) e.brokenR = true;
      if (Math.random() < 0.4 * falloff) e.noHead = true;
      if (Math.random() < 0.35 * falloff) e.noArmL = true;
      if (Math.random() < 0.35 * falloff) e.noArmR = true;
      if (e.hp <= 0) {
        startRagdoll(e, dx * 2, -220);
        eng.kill(e);
      }
    }
  }

  function spawnGore(eng, e, hx, hy, n) {
    if (!eng.particles) eng.particles = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 160;
      eng.particles.push({
        x: hx, y: hy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.4 + Math.random() * 0.7, max: 1.1,
        size: 2 + Math.random() * 5,
        color: Math.random() < 0.3 ? "#4a0810" : "#8a1020",
        gore: true
      });
    }
    if (!e.holes) e.holes = [];
    e.holes.push({ x: (hx - e.x) * (e.facing || 1), y: hy - e.y, r: 3 + Math.random() * 5, t: 0 });
    if (e.holes.length > 14) e.holes.shift();
  }

  function startRagdoll(e, impulseX, impulseY) {
    e.ragdoll = true;
    e.dead = true;
    e.fallT = 0.01;
    e.parts = e.parts || buildParts(e, impulseX, impulseY);
  }

  function buildParts(e, ix, iy) {
    var s = e.sizeScale || 1;
    var base = [
      { name: "torso", x: e.x, y: e.y - 10 * s, vx: (ix || 0) * 0.3, vy: (iy || -80) * 0.3, w: 26 * s, h: 32 * s, rot: 0, vr: (Math.random() - 0.5) * 6 },
      { name: "head", x: e.x, y: e.y - 36 * s, vx: (ix || 0) * 0.5 + (Math.random() - 0.5) * 40, vy: (iy || -120) * 0.5, w: 16 * s, h: 16 * s, rot: 0, vr: (Math.random() - 0.5) * 10 }
    ];
    if (e.noHead) base.pop();
    if (!e.noArmL) base.push({ name: "arm", x: e.x - 12 * s, y: e.y - 8 * s, vx: -60 + Math.random() * 30, vy: -40, w: 8 * s, h: 18 * s, rot: 0, vr: 4 });
    if (!e.noArmR) base.push({ name: "arm", x: e.x + 12 * s, y: e.y - 8 * s, vx: 60 + Math.random() * 30, vy: -40, w: 8 * s, h: 18 * s, rot: 0, vr: -4 });
    if (!e.brokenL) base.push({ name: "leg", x: e.x - 6 * s, y: e.y + 16 * s, vx: -20, vy: -20, w: 9 * s, h: 20 * s, rot: 0, vr: 2 });
    else base.push({ name: "leg", x: e.x - 6 * s, y: e.y + 20 * s, vx: -10, vy: 10, w: 9 * s, h: 14 * s, rot: 1.2, vr: 0.5 });
    if (!e.brokenR) base.push({ name: "leg", x: e.x + 6 * s, y: e.y + 16 * s, vx: 20, vy: -20, w: 9 * s, h: 20 * s, rot: 0, vr: -2 });
    else base.push({ name: "leg", x: e.x + 6 * s, y: e.y + 20 * s, vx: 10, vy: 10, w: 9 * s, h: 14 * s, rot: -1.2, vr: -0.5 });
    base.forEach(function (p) { p.color = e.color; p.life = 5 + Math.random() * 3; });
    return base;
  }

  var _kill = proto.kill;
  proto.kill = function (e) {
    if (e && !e.ragdoll) {
      startRagdoll(e, (Math.random() - 0.5) * 200, -120 - Math.random() * 100);
    }
    _kill.call(this, e);
    if (e) spawnGore(this, e, e.x, e.y - 10, 16);
  };

  var _update = proto.update;
  proto.update = function (dt) {
    if (this.phase === "combat" && this.enemies && this.player) {
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.dead) continue;
        var aimY = this.mouse ? this.mouse.y : e.y - 30;
        var nearFace = Math.abs(aimY - (e.y - e.r * 1.1)) < 28 && Math.abs(this.player.x - e.x) < 420;
        if (nearFace && Math.random() < 0.012) e.blocking = 0.55 + Math.random() * 0.35;
        if (e.blocking > 0) e.blocking -= dt;
      }
    }
    if (this.enemies) {
      for (var ri = 0; ri < this.enemies.length; ri++) {
        var z = this.enemies[ri];
        if (!z.ragdoll || !z.parts) continue;
        for (var pi = 0; pi < z.parts.length; pi++) {
          var p = z.parts[pi];
          p.vy += 980 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          p.vx *= 0.99;
          if (p.y + p.h * 0.5 > FLOOR_Y) {
            p.y = FLOOR_Y - p.h * 0.5;
            p.vy *= -0.35;
            p.vx *= 0.7;
            p.vr *= 0.6;
            if (Math.abs(p.vy) < 30) p.vy = 0;
          }
          p.life -= dt;
        }
        z.parts = z.parts.filter(function (p) { return p.life > 0; });
        z.corpseLife = Math.max(z.corpseLife || 0, 0.1);
      }
    }
    if (this.particles) {
      for (var gi = 0; gi < this.particles.length; gi++) {
        var gp = this.particles[gi];
        if (!gp.gore) continue;
        gp.vy += 600 * dt;
        if (gp.y > FLOOR_Y) { gp.y = FLOOR_Y; gp.vy *= -0.2; gp.vx *= 0.5; }
      }
    }
    _update.call(this, dt);
    if (this.bullets) {
      for (var bi = 0; bi < this.bullets.length; bi++) {
        var b = this.bullets[bi];
        if (!b.explosive) continue;
        if (b.y >= FLOOR_Y - 8) {
          explode(this, b.x, FLOOR_Y - 4, b.blast || 100, b.damage || 180);
          b.life = 0;
        }
      }
    }
    if (this.enemies && this.bullets) {
      for (var ei = 0; ei < this.enemies.length; ei++) {
        var en = this.enemies[ei];
        if (en.dead) continue;
        for (var bj = 0; bj < this.bullets.length; bj++) {
          var bb = this.bullets[bj];
          var dx = bb.x - en.x, dy = bb.y - en.y;
          var hitR = (en.r || 20) + (bb.r || 4);
          if (dx * dx + dy * dy > hitR * hitR * 1.8) continue;
          var headY = en.y - en.r * 1.1;
          var toFace = Math.abs(bb.y - headY) < 18 && Math.abs(dx) < en.r * 0.7;
          if (toFace && en.blocking > 0) {
            en.blocking = Math.max(0, en.blocking - 0.15);
            bb.life = 0;
            this.burst && this.burst(en.x + en.facing * 10, headY, "#c9d2dc", 6, 90);
            this.say("BLOCKED", 0.25);
            continue;
          }
          if (toFace && Math.random() < 0.25) en.blocking = 0.4;
          if (bb.damage >= 28 && Math.random() < 0.12) {
            if (bb.y < en.y - 10) en.noHead = true;
            else if (Math.random() < 0.5) en.noArmL = true;
            else en.noArmR = true;
            spawnGore(this, en, bb.x, bb.y, 10);
          }
          if (bb.y > en.y + 5 && Math.random() < 0.18) {
            if (dx * en.facing < 0) en.brokenL = true;
            else en.brokenR = true;
          }
          spawnGore(this, en, bb.x, bb.y, 5);
          if (bb.explosive) {
            explode(this, bb.x, bb.y, bb.blast || 100, bb.damage || 180);
            bb.life = 0;
          }
        }
      }
    }
  };

  var _draw = proto.draw;
  proto.draw = function (ctx) {
    _draw.call(this, ctx);
    try {
      if (!this.enemies) return;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.ragdoll && e.parts) {
          for (var j = 0; j < e.parts.length; j++) {
            var p = e.parts[j];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot || 0);
            ctx.globalAlpha = Math.max(0.15, Math.min(1, p.life / 2));
            ctx.fillStyle = p.name === "head" ? "#c4a090" : (p.color || e.color);
            rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 3);
            if (p.name === "head") {
              ctx.fillStyle = "#150a1c";
              rr(ctx, -p.w * 0.3, -p.h * 0.2, p.w * 0.7, p.h * 0.35, 2);
            }
            ctx.fillStyle = "#8a1020";
            ctx.globalAlpha *= 0.7;
            rr(ctx, -p.w * 0.2, p.h * 0.1, p.w * 0.3, p.h * 0.25, 2);
            ctx.restore();
          }
          continue;
        }
        if (e.dead) continue;
        if (e.holes && e.holes.length) {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.scale(e.facing || 1, 1);
          for (var h = 0; h < e.holes.length; h++) {
            var hole = e.holes[h];
            ctx.fillStyle = "#2a0508";
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#8a1020";
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.r * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        if (e.blocking > 0) {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.scale(e.facing || 1, 1);
          var sc = e.sizeScale || 1;
          ctx.fillStyle = e.color;
          rr(ctx, 4 * sc, -38 * sc, 10 * sc, 16 * sc, 3);
          rr(ctx, -6 * sc, -36 * sc, 10 * sc, 14 * sc, 3);
          ctx.fillStyle = "#c4a090";
          rr(ctx, 6 * sc, -42 * sc, 8 * sc, 8 * sc, 3);
          rr(ctx, -4 * sc, -40 * sc, 8 * sc, 8 * sc, 3);
          ctx.restore();
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  console.log("[DeadSignal] v37 ragdoll + gore + RPG");
})();
