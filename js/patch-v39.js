// DeadSignal v39 — Space kick (not hatchet), shotgun falloff, gun scale, flying limbs
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

  function burstBlood(eng, x, y, n, p) {
    if (!eng.particles) eng.particles = [];
    var cols = ["#6b0000", "#8b0a1a", "#c41e3a", "#4a0000", "#9b1b2f"];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * p;
      eng.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.35 + Math.random() * 0.7, max: 1.05,
        size: 2 + Math.random() * 6,
        color: cols[i % cols.length], gore: true
      });
    }
  }

  function spawnLimb(eng, e, kind, hx, hy, dir) {
    if (!eng.flyParts) eng.flyParts = [];
    var s = e.sizeScale || 1;
    var w = kind === "head" ? 16 * s : kind === "torso" ? 22 * s : kind === "arm" ? 9 * s : 10 * s;
    var h = kind === "head" ? 16 * s : kind === "torso" ? 18 * s : kind === "arm" ? 18 * s : 20 * s;
    eng.flyParts.push({
      kind: kind, x: hx, y: hy,
      vx: dir * (140 + Math.random() * 180) + (Math.random() - 0.5) * 80,
      vy: -160 - Math.random() * 140,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      w: w, h: h,
      color: kind === "head" ? "#c4a090" : (e.color || "#5a3a48"),
      life: 4.5 + Math.random() * 2
    });
    burstBlood(eng, hx, hy, 14, 180);
  }

  function addHole(e, hx, hy) {
    if (!e.holes) e.holes = [];
    e.holes.push({ x: (hx - e.x) * (e.facing || 1), y: hy - e.y, r: 3.5 + Math.random() * 5 });
    if (e.holes.length > 18) e.holes.shift();
  }

  proto.legKick = function () {
    if (this.phase !== "combat" && this.phase !== "intermission") return;
    if (this.paused || this.shopOpen) return;
    if ((this.player.legKickT || 0) > 0) return;
    this.player.legKickT = 0.42;
    this.player.kick = 0;
    this.trauma = Math.min(1, (this.trauma || 0) + 0.18);
    this.say("KICK", 0.22);
    var facing = this.player.facing || 1;
    var reach = 78;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var dx = e.x - this.player.x;
      if (Math.sign(dx || facing) !== facing) continue;
      var d = Math.abs(dx);
      if (d > reach + (e.r || 20)) continue;
      if (Math.abs(e.y - this.player.y) > 70) continue;
      var f = Math.max(0.2, (reach - d) / reach);
      if (e.size !== "tall") {
        e.vx = (e.vx || 0) + facing * 420 * f;
        e.knock = 0.22;
      }
      e.hp -= 16;
      e.hit = 0.14;
      burstBlood(this, e.x, e.y + 12, 6, 90);
      if (e.hp <= 0) this.kill(e);
    }
  };
  proto.pulseKick = function () { this.legKick(); };

  proto.swingHatchet = function () {
    if (this.phase !== "combat" && this.phase !== "intermission") return;
    if (this.paused || this.shopOpen) return;
    if ((this.player.kick || 0) > 0) return;
    this.player.kick = 0.32;
    this.trauma = Math.min(1, (this.trauma || 0) + 0.22);
    this.say("HATCHET", 0.22);
    var facing = this.player.facing || 1;
    var reach = 92;
    var boxL = Math.min(this.player.x, this.player.x + facing * reach) - 6;
    var boxR = Math.max(this.player.x, this.player.x + facing * reach) + 6;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var hitX = e.x;
      if (!(hitX + e.r * 0.55 >= boxL && hitX - e.r * 0.55 <= boxR)) continue;
      if (Math.sign((e.x - this.player.x) || facing) !== facing) continue;
      var d = Math.abs(e.x - this.player.x);
      var f = Math.max(0.15, (reach - d) / reach);
      var kb = e.size === "tall" ? 160 : 380;
      e.vx = (e.vx || 0) + facing * kb * f;
      e.knock = e.size === "tall" ? 0.12 : 0.28;
      var hd = 42;
      if ((e.armor || 0) > 0) hd = Math.max(8, hd - Math.floor(e.armor * 0.55));
      e.hp -= hd;
      e.hit = 0.18;
      burstBlood(this, e.x, e.y - 8, 10, 140);
      if (Math.random() < 0.35 && !e.noArmR) {
        e.noArmR = true;
        spawnLimb(this, e, "arm", e.x + 10, e.y - 6, facing);
      }
      if (e.hp <= 0) this.kill(e);
    }
  };

  if (!window.__ds39Keys) {
    window.__ds39Keys = true;
    window.addEventListener("keydown", function (e) {
      var g = window.__deadSignal;
      if (!g) return;
      if (e.code === "Space") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (g.phase === "menu") { g.startRun && g.startRun(); return; }
        g.legKick();
      }
      if (e.code === "KeyE") {
        e.preventDefault();
        e.stopImmediatePropagation();
        g.swingHatchet();
      }
    }, true);
  }

  function shotgunMul(dist) {
    if (dist < 70) return 2.8;
    if (dist < 130) return 2.1;
    if (dist < 200) return 1.35;
    if (dist < 280) return 0.85;
    if (dist < 380) return 0.45;
    return 0.22;
  }

  var _fire = proto.fire;
  proto.fire = function () {
    var w = this.weapon && this.weapon();
    var before = this.bullets ? this.bullets.length : 0;
    var px = this.player.x;
    _fire.call(this);
    if (!this.bullets || !w) return;
    var isShot = w.pellets > 1 || w.hold === "shotgun" || w.id === "scatter" || w.id === "slug" || w.id === "cluster";
    for (var i = before; i < this.bullets.length; i++) {
      var b = this.bullets[i];
      b.originX = px;
      b.baseDmg = b.damage;
      if (isShot) b.shotgun = true;
    }
  };

  var _update = proto.update;
  proto.update = function (dt) {
    if (this.player && this.player.legKickT > 0) this.player.legKickT = Math.max(0, this.player.legKickT - dt);
    if (this.bullets) {
      for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.shotgun && b.originX != null) {
          b.damage = Math.max(1, Math.round((b.baseDmg || 18) * shotgunMul(Math.abs(b.x - b.originX))));
        }
      }
    }
    var hpMap = {};
    if (this.enemies) {
      for (var ei = 0; ei < this.enemies.length; ei++) hpMap[this.enemies[ei].id] = this.enemies[ei].hp;
    }
    _update.call(this, dt);
    if (this.flyParts) {
      for (var fi = 0; fi < this.flyParts.length; fi++) {
        var p = this.flyParts[fi];
        p.vy += 980 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vx *= 0.99;
        if (p.y + p.h * 0.5 > FLOOR_Y) {
          p.y = FLOOR_Y - p.h * 0.5; p.vy *= -0.28; p.vx *= 0.62; p.vr *= 0.55;
          if (Math.abs(p.vy) < 30) p.vy = 0;
        }
        p.life -= dt;
      }
      this.flyParts = this.flyParts.filter(function (p) { return p.life > 0; });
    }
    if (this.enemies) {
      for (var ej = 0; ej < this.enemies.length; ej++) {
        var e = this.enemies[ej];
        var prev = hpMap[e.id];
        if (prev == null || e.hp >= prev) continue;
        var dir = Math.sign(e.x - (this.player ? this.player.x : e.x)) || 1;
        addHole(e, e.x + (Math.random() - 0.5) * 12, e.y + (Math.random() - 0.5) * 18);
        burstBlood(this, e.x, e.y, 8, 120);
        var zone = Math.random();
        if (zone < 0.22 && !e.noHead) {
          e.noHead = true;
          spawnLimb(this, e, "head", e.x, e.y - (e.r || 24) * 1.1, dir);
          this.say("HEAD OFF", 0.35);
        } else if (zone < 0.48 && !e.noArmL) {
          e.noArmL = true;
          spawnLimb(this, e, "arm", e.x - 12, e.y - 8, -dir);
        } else if (zone < 0.74 && !e.noArmR) {
          e.noArmR = true;
          spawnLimb(this, e, "arm", e.x + 12, e.y - 8, dir);
        } else if (zone < 0.9) {
          if (!e.brokenL) { e.brokenL = true; spawnLimb(this, e, "leg", e.x - 6, e.y + 16, -dir); }
          else if (!e.brokenR) { e.brokenR = true; spawnLimb(this, e, "leg", e.x + 6, e.y + 16, dir); }
        }
      }
    }
  };

  var GUN_H = { pistol: 14, smg: 16, shotgun: 16, scatter: 16, rifle: 17, carbine: 17, lmg: 18, auto: 18, sniper: 15, rail: 16, hatchet: 28, rpg: 16, melee: 28 };
  var GUN_MAX_W = { pistol: 38, smg: 50, shotgun: 64, scatter: 64, rifle: 58, carbine: 58, lmg: 62, auto: 62, sniper: 78, rail: 76, hatchet: 42, rpg: 70, melee: 42 };

  var _draw = proto.draw;
  proto.draw = function (ctx) {
    var origDrawImage = ctx.drawImage;
    var guns = window.DS_GUNS || {};
    ctx.drawImage = function (img, a, b, c, d, e, f, g, h) {
      var isGun = false, key = null;
      for (var k in guns) { if (guns[k] === img) { isGun = true; key = k; break; } }
      if (isGun && arguments.length >= 5) {
        var x, y, w, hgt;
        if (arguments.length === 5) { x = a; y = b; w = c; hgt = d; }
        else { x = e; y = f; w = g; hgt = h; }
        var nw = img.naturalWidth || w || 1;
        var nh = img.naturalHeight || hgt || 1;
        var aspect = nw / nh;
        var maxH = GUN_H[key] || 16;
        var maxW = GUN_MAX_W[key] || 56;
        var nh2 = Math.min(maxH, maxW / aspect);
        var nw2 = nh2 * aspect;
        if (nw2 > maxW) { nw2 = maxW; nh2 = nw2 / aspect; }
        if (arguments.length === 5) return origDrawImage.call(ctx, img, x, y, nw2, nh2);
        return origDrawImage.call(ctx, img, a, b, c, d, x, y, nw2, nh2);
      }
      return origDrawImage.apply(ctx, arguments);
    };
    if (typeof _draw === "function") _draw.call(this, ctx);
    ctx.drawImage = origDrawImage;
    try {
      var cam = this.camX || 0;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(-cam, 0);
      if (this.player && (this.player.legKickT || 0) > 0) {
        var pl = this.player;
        var ext = (1 - Math.abs(this.player.legKickT / 0.42 - 0.45) * 1.4) * 36;
        ctx.save();
        ctx.translate(pl.x, FLOOR_Y - 6);
        ctx.scale(pl.facing || 1, 1);
        ctx.fillStyle = "#3b2a52";
        rr(ctx, 8, -18, 12, 10, 3);
        ctx.fillStyle = "#120816";
        rr(ctx, 8 + ext, -16, 16, 9, 3);
        ctx.restore();
      }
      if (this.enemies) {
        for (var i = 0; i < this.enemies.length; i++) {
          var e = this.enemies[i];
          var sc = e.sizeScale || 1;
          if (e.holes && e.holes.length && !e.dead) {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.scale(e.facing || 1, 1);
            for (var hi = 0; hi < e.holes.length; hi++) {
              var hole = e.holes[hi];
              ctx.fillStyle = "#1a0204";
              ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#8a1020";
              ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r * 0.55, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "rgba(180,20,40,0.45)";
              ctx.beginPath(); ctx.arc(hole.x + 1, hole.y + hole.r, hole.r * 0.4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
          if (e.dead) continue;
          if (e.noHead) {
            ctx.fillStyle = "#4a0000";
            rr(ctx, e.x - 8 * sc, e.y - (e.r || 24) * 1.05, 16 * sc, 10 * sc, 3);
            ctx.fillStyle = "#8a1020";
            rr(ctx, e.x - 5 * sc, e.y - (e.r || 24), 10 * sc, 6 * sc, 2);
          }
          if (e.noArmL) { ctx.fillStyle = "#6b0000"; rr(ctx, e.x - 16 * sc * (e.facing || 1), e.y - 10 * sc, 8 * sc, 8 * sc, 2); }
          if (e.noArmR) { ctx.fillStyle = "#6b0000"; rr(ctx, e.x + 8 * sc * (e.facing || 1), e.y - 10 * sc, 8 * sc, 8 * sc, 2); }
        }
      }
      if (this.flyParts) {
        for (var j = 0; j < this.flyParts.length; j++) {
          var fp = this.flyParts[j];
          ctx.save();
          ctx.translate(fp.x, fp.y);
          ctx.rotate(fp.rot || 0);
          ctx.globalAlpha = Math.max(0.25, Math.min(1, fp.life / 2));
          ctx.fillStyle = fp.color;
          rr(ctx, -fp.w / 2, -fp.h / 2, fp.w, fp.h, 3);
          if (fp.kind === "head") { ctx.fillStyle = "#150a1c"; rr(ctx, -fp.w * 0.3, -fp.h * 0.25, fp.w * 0.7, fp.h * 0.35, 2); }
          ctx.fillStyle = "#8a1020";
          rr(ctx, -fp.w * 0.2, fp.h * 0.15, fp.w * 0.35, fp.h * 0.25, 2);
          ctx.restore();
        }
      }
      ctx.restore();
    } catch (err) {}
  };

  var kb = document.getElementById("kick-btn");
  if (kb && !kb.__ds39) {
    kb.__ds39 = true;
    kb.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var g = window.__deadSignal;
      if (g) g.legKick();
    }, true);
  }

  console.log("[DeadSignal] v39 kick/shotgun/limbs/gun-scale");
})();
