// DeadSignal v40 — real kick (not hatchet), shotgun falloff, gun ratios, flying limbs
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

  function engine() {
    return window.__deadSignal || window.__dsEngine || null;
  }
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
    var cols = ["#6b0000", "#8b0a1a", "#c41e3a", "#4a0000", "#9b1b2f", "#e02030"];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 50 + Math.random() * p;
      eng.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 70,
        life: 0.4 + Math.random() * 0.7, max: 1.1,
        size: 2 + Math.random() * 6,
        color: cols[i % cols.length], gore: true
      });
    }
  }
  function spawnLimb(eng, e, kind, hx, hy, dir) {
    if (!eng.flyParts) eng.flyParts = [];
    var s = e.sizeScale || 1;
    var dim = {
      head: [18 * s, 18 * s],
      arm: [10 * s, 22 * s],
      leg: [11 * s, 24 * s],
      torso: [24 * s, 20 * s]
    }[kind] || [12 * s, 16 * s];
    eng.flyParts.push({
      kind: kind, x: hx, y: hy,
      vx: dir * (180 + Math.random() * 220) + (Math.random() - 0.5) * 90,
      vy: -200 - Math.random() * 160,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16,
      w: dim[0], h: dim[1],
      color: kind === "head" ? "#c4a090" : (e.color || "#5a3a48"),
      life: 5 + Math.random() * 2
    });
    burstBlood(eng, hx, hy, 16, 200);
  }
  function addHole(e, hx, hy) {
    if (!e.holes) e.holes = [];
    e.holes.push({
      x: (hx - e.x) * (e.facing || 1),
      y: hy - e.y,
      r: 4 + Math.random() * 5
    });
    if (e.holes.length > 20) e.holes.shift();
  }
  function dismember(eng, e, dir) {
    var zone = Math.random();
    if (zone < 0.18 && !e.noHead) {
      e.noHead = true;
      spawnLimb(eng, e, "head", e.x, e.y - (e.r || 24) * 1.15, dir);
      eng.say && eng.say("HEAD OFF", 0.4);
    } else if (zone < 0.5 && !e.noArmL) {
      e.noArmL = true;
      spawnLimb(eng, e, "arm", e.x - 14 * (e.facing || 1), e.y - 8, -dir);
    } else if (zone < 0.82 && !e.noArmR) {
      e.noArmR = true;
      spawnLimb(eng, e, "arm", e.x + 14 * (e.facing || 1), e.y - 8, dir);
    } else {
      if (!e.brokenL) {
        e.brokenL = true;
        spawnLimb(eng, e, "leg", e.x - 8, e.y + 16, -dir);
      } else if (!e.brokenR) {
        e.brokenR = true;
        spawnLimb(eng, e, "leg", e.x + 8, e.y + 16, dir);
      }
    }
  }

  // Space = kick. Never set player.kick (that draws the hatchet).
  proto.legKick = function () {
    if (this.phase !== "combat" && this.phase !== "intermission") return;
    if (this.paused || this.shopOpen) return;
    if ((this.player.legKickT || 0) > 0) return;
    this.player.legKickT = 0.38;
    this.player.kick = 0;
    this.trauma = Math.min(1, (this.trauma || 0) + 0.16);
    this.say("KICK", 0.2);
    var facing = this.player.facing || 1;
    var reach = 82;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var dx = e.x - this.player.x;
      if (Math.sign(dx || facing) !== facing) continue;
      if (Math.abs(dx) > reach + (e.r || 20)) continue;
      if (Math.abs(e.y - this.player.y) > 80) continue;
      var f = Math.max(0.25, (reach - Math.abs(dx)) / reach);
      if (e.size !== "tall") {
        e.vx = (e.vx || 0) + facing * 480 * f;
        e.knock = 0.24;
      }
      e.hp -= 18;
      e.hit = 0.16;
      burstBlood(this, e.x, e.y + 14, 7, 100);
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
    var reach = 94;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var dx = e.x - this.player.x;
      if (Math.sign(dx || facing) !== facing) continue;
      if (Math.abs(dx) > reach + (e.r || 20)) continue;
      var f = Math.max(0.15, (reach - Math.abs(dx)) / reach);
      var kb = e.size === "tall" ? 150 : 400;
      e.vx = (e.vx || 0) + facing * kb * f;
      e.knock = e.size === "tall" ? 0.1 : 0.28;
      var hd = 42;
      if ((e.armor || 0) > 0) hd = Math.max(8, hd - Math.floor(e.armor * 0.55));
      e.hp -= hd;
      e.hit = 0.18;
      burstBlood(this, e.x, e.y - 8, 12, 150);
      if (Math.random() < 0.45) dismember(this, e, facing);
      if (e.hp <= 0) this.kill(e);
    }
  };

  if (!window.__ds40Keys) {
    window.__ds40Keys = true;
    window.addEventListener("keydown", function (e) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      var g = engine();
      if (!g) return;
      if (e.code === "Space") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (g.phase === "menu" || g.phase === "dead") { g.startRun && g.startRun(); return; }
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
    if (dist < 60) return 3.0;
    if (dist < 110) return 2.2;
    if (dist < 170) return 1.4;
    if (dist < 250) return 0.8;
    if (dist < 340) return 0.4;
    return 0.18;
  }

  var _fire = proto.fire;
  proto.fire = function () {
    var w = this.weapon && this.weapon();
    var before = this.bullets ? this.bullets.length : 0;
    var px = this.player.x;
    _fire.call(this);
    if (!this.bullets || !w) return;
    var isShot = (w.pellets || 1) > 1 || w.hold === "shotgun" || w.id === "scatter" || w.id === "slug" || w.id === "cluster";
    for (var i = before; i < this.bullets.length; i++) {
      this.bullets[i].originX = px;
      this.bullets[i].baseDmg = this.bullets[i].damage;
      if (isShot) this.bullets[i].shotgun = true;
    }
  };

  var _update = proto.update;
  proto.update = function (dt) {
    if (this.player && this.player.legKickT > 0) {
      this.player.legKickT = Math.max(0, this.player.legKickT - dt);
    }
    if (this.bullets) {
      for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.shotgun && b.originX != null) {
          b.damage = Math.max(1, Math.round((b.baseDmg || 18) * shotgunMul(Math.abs(b.x - b.originX))));
        }
      }
    }
    if (this.enemies) {
      for (var ei = 0; ei < this.enemies.length; ei++) {
        var en = this.enemies[ei];
        if (en._hpPrev == null) en._hpPrev = en.hp;
      }
    }
    _update.call(this, dt);

    if (this.flyParts) {
      for (var fi = 0; fi < this.flyParts.length; fi++) {
        var p = this.flyParts[fi];
        p.vy += 980 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.vx *= 0.99;
        if (p.y + p.h * 0.5 > FLOOR_Y) {
          p.y = FLOOR_Y - p.h * 0.5;
          p.vy *= -0.28;
          p.vx *= 0.6;
          p.vr *= 0.5;
          if (Math.abs(p.vy) < 28) p.vy = 0;
        }
        p.life -= dt;
      }
      this.flyParts = this.flyParts.filter(function (p) { return p.life > 0; });
    }
    if (this.particles) {
      for (var gi = 0; gi < this.particles.length; gi++) {
        var gp = this.particles[gi];
        if (!gp.gore) continue;
        gp.vy += 620 * dt;
        if (gp.y > FLOOR_Y) { gp.y = FLOOR_Y; gp.vy *= -0.12; gp.vx *= 0.5; }
      }
    }
    if (this.enemies) {
      for (var ej = 0; ej < this.enemies.length; ej++) {
        var e = this.enemies[ej];
        if (e.dead) { e._hpPrev = e.hp; continue; }
        var prev = e._hpPrev;
        if (prev != null && e.hp < prev - 0.4) {
          var dir = Math.sign(e.x - (this.player ? this.player.x : e.x)) || 1;
          addHole(e, e.x + (Math.random() - 0.5) * 14, e.y + (Math.random() - 0.5) * 20);
          burstBlood(this, e.x, e.y, 10, 140);
          if (Math.random() < 0.72) dismember(this, e, dir);
        }
        e._hpPrev = e.hp;
      }
    }
  };

  var GUN_H = { pistol: 12, smg: 13, shotgun: 14, scatter: 14, slug: 14, cluster: 14, rifle: 14, carbine: 14, lmg: 15, auto: 15, m249: 15, sniper: 13, rail: 14, hatchet: 26, melee: 26, rpg: 14, launcher: 14 };
  var GUN_W = { pistol: 34, smg: 48, shotgun: 62, scatter: 62, slug: 62, cluster: 62, rifle: 56, carbine: 56, lmg: 60, auto: 60, m249: 60, sniper: 76, rail: 72, hatchet: 38, melee: 38, rpg: 68, launcher: 68 };

  var _draw = proto.draw;
  proto.draw = function (ctx) {
    var origDrawImage = ctx.drawImage;
    var guns = window.DS_GUNS || {};
    ctx.drawImage = function (img, a, b, c, d, e, f, g, h) {
      var key = null;
      for (var k in guns) { if (guns[k] === img) { key = k; break; } }
      if (key && arguments.length >= 5) {
        var x, y, w, hgt, sx, sy, sw, sh, nine;
        if (arguments.length === 5) { x = a; y = b; w = c; hgt = d; nine = false; }
        else { sx = a; sy = b; sw = c; sh = d; x = e; y = f; w = g; hgt = h; nine = true; }
        var nw = img.naturalWidth || w || 1;
        var nh = img.naturalHeight || hgt || 1;
        var aspect = nw / Math.max(1, nh);
        if (aspect < 1.6 && key !== "hatchet" && key !== "melee") aspect = GUN_W[key] / Math.max(1, GUN_H[key]);
        var maxH = GUN_H[key] || 14;
        var maxW = GUN_W[key] || 56;
        var nh2 = Math.min(maxH, maxW / aspect);
        var nw2 = nh2 * aspect;
        if (nw2 > maxW) { nw2 = maxW; nh2 = nw2 / aspect; }
        var ox = x + (w - nw2) * 0.15;
        var oy = y + (hgt - nh2) * 0.55;
        if (!nine) return origDrawImage.call(ctx, img, ox, oy, nw2, nh2);
        return origDrawImage.call(ctx, img, sx, sy, sw, sh, ox, oy, nw2, nh2);
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
        var t = this.player.legKickT / 0.38;
        var ext = Math.max(0, (1 - Math.abs(t - 0.4) * 1.6)) * 42;
        ctx.save();
        ctx.translate(pl.x, FLOOR_Y - 4);
        ctx.scale(pl.facing || 1, 1);
        ctx.fillStyle = "#3b2a52";
        rr(ctx, 6, -22, 13, 12, 3);
        ctx.fillStyle = "#120816";
        rr(ctx, 10 + ext, -18, 18, 10, 3);
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
              ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r * 0.5, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "rgba(180,20,40,0.5)";
              ctx.beginPath(); ctx.arc(hole.x + 1, hole.y + hole.r * 0.8, hole.r * 0.45, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
          if (e.dead) continue;
          if (e.noHead) {
            ctx.fillStyle = "#2a0004";
            rr(ctx, e.x - 10 * sc, e.y - (e.r || 24) * 1.25, 20 * sc, 16 * sc, 4);
            ctx.fillStyle = "#8a1020";
            rr(ctx, e.x - 7 * sc, e.y - (e.r || 24) * 1.12, 14 * sc, 10 * sc, 3);
          }
          if (e.noArmL) {
            ctx.fillStyle = "#6b0000";
            rr(ctx, e.x - 18 * sc * (e.facing || 1), e.y - 12 * sc, 10 * sc, 10 * sc, 3);
          }
          if (e.noArmR) {
            ctx.fillStyle = "#6b0000";
            rr(ctx, e.x + 8 * sc * (e.facing || 1), e.y - 12 * sc, 10 * sc, 10 * sc, 3);
          }
        }
      }

      if (this.flyParts) {
        for (var j = 0; j < this.flyParts.length; j++) {
          var fp = this.flyParts[j];
          ctx.save();
          ctx.translate(fp.x, fp.y);
          ctx.rotate(fp.rot || 0);
          ctx.globalAlpha = Math.max(0.3, Math.min(1, fp.life / 2));
          ctx.fillStyle = fp.color;
          rr(ctx, -fp.w / 2, -fp.h / 2, fp.w, fp.h, 3);
          if (fp.kind === "head") {
            ctx.fillStyle = "#150a1c";
            rr(ctx, -fp.w * 0.3, -fp.h * 0.25, fp.w * 0.7, fp.h * 0.35, 2);
          }
          ctx.fillStyle = "#8a1020";
          rr(ctx, -fp.w * 0.2, fp.h * 0.12, fp.w * 0.4, fp.h * 0.28, 2);
          ctx.restore();
        }
      }
      ctx.restore();
    } catch (err) {}
  };

  var kb = document.getElementById("kick-btn");
  if (kb && !kb.__ds40) {
    kb.__ds40 = true;
    kb.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var g = engine();
      if (g) g.legKick();
    }, true);
  }

  var tag = document.getElementById("build-tag");
  if (tag) tag.textContent = "BUILD v40 — kick · falloff · limbs";
  var kicker = document.getElementById("menu-kicker");
  if (kicker) kicker.textContent = "Null X Interactive · BUILD v40";

  console.log("[DeadSignal] v40 kick/shotgun/limbs/gun-scale");
})();
