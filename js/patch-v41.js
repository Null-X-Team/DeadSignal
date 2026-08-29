// DeadSignal v41 — credits/holes/limbs (BUILD tag owned by v43)
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

  function burst(eng, x, y, n, power) {
    if (!eng.particles) eng.particles = [];
    var cols = ["#6b0000", "#8b0a1a", "#c41e3a", "#4a0000", "#e02030", "#9b1b2f"];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * power;
      eng.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0.45 + Math.random() * 0.7, max: 1.2,
        size: 2 + Math.random() * 6,
        color: cols[i % cols.length], gore: true
      });
    }
  }

  function addHoleAt(e, worldX, worldY) {
    if (!e.holes) e.holes = [];
    e.holes.push({
      x: (worldX - e.x) * (e.facing || 1),
      y: worldY - e.y,
      r: 3.5 + Math.random() * 4.5
    });
    if (e.holes.length > 22) e.holes.shift();
  }

  function flyPart(eng, e, kind, wx, wy, dir) {
    if (!eng.flyParts) eng.flyParts = [];
    var s = e.sizeScale || 1;
    var dims = {
      head: [17 * s, 17 * s],
      arm: [9 * s, 20 * s],
      leg: [10 * s, 22 * s],
      torso: [22 * s, 18 * s]
    }[kind] || [12 * s, 14 * s];
    eng.flyParts.push({
      kind: kind, x: wx, y: wy,
      vx: dir * (160 + Math.random() * 200) + (Math.random() - 0.5) * 80,
      vy: -180 - Math.random() * 160,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      w: dims[0], h: dims[1],
      color: kind === "head" ? "#c4a090" : (e.color || "#5a3a48"),
      life: 6 + Math.random() * 3
    });
    burst(eng, wx, wy, 12, 180);
  }

  function popLimb(eng, e, wx, wy) {
    var dir = Math.sign(e.x - (eng.player ? eng.player.x : e.x)) || 1;
    var r = Math.random();
    var headY = e.y - (e.r || 24) * 1.1;
    if (Math.abs(wy - headY) < 16 && !e.noHead && r < 0.55) {
      e.noHead = true;
      flyPart(eng, e, "head", e.x, headY, dir);
      eng.say && eng.say("HEADSHOT", 0.35);
      return;
    }
    if (wy > e.y + 6) {
      if (!e.brokenL && (wx < e.x || e.brokenR)) {
        e.brokenL = true;
        flyPart(eng, e, "leg", e.x - 8, e.y + 14, -dir);
      } else if (!e.brokenR) {
        e.brokenR = true;
        flyPart(eng, e, "leg", e.x + 8, e.y + 14, dir);
      }
      return;
    }
    if (!e.noArmL && r < 0.5) {
      e.noArmL = true;
      flyPart(eng, e, "arm", e.x - 12 * (e.facing || 1), e.y - 6, -dir);
    } else if (!e.noArmR) {
      e.noArmR = true;
      flyPart(eng, e, "arm", e.x + 12 * (e.facing || 1), e.y - 6, dir);
    }
  }

  proto.kill = function (e) {
    if (!e) return;
    if (!e._scored) {
      e._scored = true;
      var sc = Math.max(1, e.score || 12);
      this.score = (this.score || 0) + sc;
      this.credits = (this.credits || 0) + sc;
      try { if (this.sfx && this.sfx.hit) this.sfx.hit(); } catch (err) {}
      if (Math.random() < 0.14 && this.weapon) {
        var w = this.weapon();
        if (w) {
          w.reserve = (w.reserve || 0) + (w.id === "pistol" ? 6 : 3);
          this.say && this.say("+ AMMO", 0.35);
        }
      }
      this.say && this.say("+" + sc + " CR", 0.4);
      if (this.pushHud) this.pushHud();
    }
    if (!e.dead) {
      e.dead = true;
      e.fallT = 0.01;
      e.corpseLife = 14;
      var dir = Math.sign(e.x - (this.player ? this.player.x : e.x)) || 1;
      burst(this, e.x, e.y - 8, 18, 200);
      burst(this, e.x, e.y + 6, 10, 120);
      if (!e._limbBurst) {
        e._limbBurst = true;
        if (!e.noArmR) { e.noArmR = true; flyPart(this, e, "arm", e.x + 10, e.y - 6, dir); }
        if (Math.random() < 0.55 && !e.noArmL) { e.noArmL = true; flyPart(this, e, "arm", e.x - 10, e.y - 6, -dir); }
        if (Math.random() < 0.35 && !e.noHead) { e.noHead = true; flyPart(this, e, "head", e.x, e.y - (e.r || 24) * 1.1, dir); }
      }
      this.trauma = Math.min(1, (this.trauma || 0) + 0.2);
    } else {
      e.corpseLife = Math.max(e.corpseLife || 0, 10);
      e.fallT = Math.max(e.fallT || 0, 0.01);
    }
  };

  var _update = proto.update;
  proto.update = function (dt) {
    var pendingHoles = [];
    if (this.bullets && this.enemies && this.phase === "combat") {
      for (var bi = 0; bi < this.bullets.length; bi++) {
        var b = this.bullets[bi];
        if (b._holeTagged) continue;
        for (var ei = 0; ei < this.enemies.length; ei++) {
          var en = this.enemies[ei];
          if (en.dead) continue;
          var dx = b.x - en.x, dy = b.y - en.y;
          var hitR = (en.r || 22) + (b.r || 4);
          if (dx * dx + dy * dy < hitR * hitR * 1.35) {
            b._holeTagged = true;
            pendingHoles.push({ e: en, x: b.x, y: b.y });
          }
        }
      }
    }
    if (this.enemies) {
      for (var i = 0; i < this.enemies.length; i++) {
        var e0 = this.enemies[i];
        if (e0._hpPrev == null) e0._hpPrev = e0.hp;
      }
    }
    _update.call(this, dt);

    for (var pi = 0; pi < pendingHoles.length; pi++) {
      var ph = pendingHoles[pi];
      if (!ph.e) continue;
      addHoleAt(ph.e, ph.x, ph.y);
      burst(this, ph.x, ph.y, 6, 110);
      if (Math.random() < 0.55) popLimb(this, ph.e, ph.x, ph.y);
    }

    if (this.enemies) {
      for (var ej = 0; ej < this.enemies.length; ej++) {
        var e = this.enemies[ej];
        if (e.dead) {
          e.fallT = Math.min(1, (e.fallT || 0) + dt * 2.4);
          if ((e.corpseLife || 0) < 8) e.corpseLife = 8 + (e.corpseLife || 0);
        }
        if (!e.dead && e._hpPrev != null && e.hp < e._hpPrev - 0.5) {
          var hx = e.x + (Math.random() - 0.5) * 10;
          var hy = e.y + (Math.random() - 0.5) * 16;
          addHoleAt(e, hx, hy);
          burst(this, hx, hy, 5, 90);
          if (Math.random() < 0.4) popLimb(this, e, hx, hy);
        }
        e._hpPrev = e.hp;
      }
    }

    if (this.flyParts) {
      for (var fi = 0; fi < this.flyParts.length; fi++) {
        var p = this.flyParts[fi];
        p.vy += 980 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += (p.vr || 0) * dt;
        p.vx *= 0.99;
        if (p.y + p.h * 0.5 > FLOOR_Y) {
          p.y = FLOOR_Y - p.h * 0.5;
          p.vy *= -0.28;
          p.vx *= 0.6;
          p.vr *= 0.5;
          if (Math.abs(p.vy) < 26) p.vy = 0;
        }
        p.life -= dt;
      }
      this.flyParts = this.flyParts.filter(function (p) { return p.life > 0; });
    }
    if (this.particles) {
      for (var gi = 0; gi < this.particles.length; gi++) {
        var gp = this.particles[gi];
        if (!gp.gore) continue;
        gp.vy += 600 * dt;
        if (gp.y > FLOOR_Y) { gp.y = FLOOR_Y; gp.vy *= -0.12; gp.vx *= 0.5; }
      }
    }
  };

  var _draw = proto.draw;
  proto.draw = function (ctx) {
    if (typeof _draw === "function") _draw.call(this, ctx);
    try {
      var cam = this.camX || 0;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(-cam, 0);

      if (this.enemies) {
        for (var i = 0; i < this.enemies.length; i++) {
          var e = this.enemies[i];
          var sc = e.sizeScale || 1;
          if (e.holes && e.holes.length && (e.fallT || 0) < 0.85) {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.scale(e.facing || 1, 1);
            if (e.dead && e.fallT) ctx.rotate((e.facing >= 0 ? 1 : -1) * (Math.PI / 2) * Math.min(1, e.fallT));
            for (var hi = 0; hi < e.holes.length; hi++) {
              var hole = e.holes[hi];
              ctx.fillStyle = "#140204";
              ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#8a1020";
              ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r * 0.5, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "rgba(160,20,40,0.55)";
              ctx.beginPath(); ctx.arc(hole.x + 1, hole.y + hole.r * 0.7, hole.r * 0.4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
          if (!e.dead && e.noHead) {
            ctx.fillStyle = "#2a0004";
            rr(ctx, e.x - 10 * sc, e.y - (e.r || 24) * 1.25, 20 * sc, 14 * sc, 4);
            ctx.fillStyle = "#8a1020";
            rr(ctx, e.x - 7 * sc, e.y - (e.r || 24) * 1.12, 14 * sc, 9 * sc, 3);
          }
        }
      }

      if (this.flyParts) {
        for (var j = 0; j < this.flyParts.length; j++) {
          var fp = this.flyParts[j];
          ctx.save();
          ctx.translate(fp.x, fp.y);
          ctx.rotate(fp.rot || 0);
          ctx.globalAlpha = Math.max(0.3, Math.min(1, fp.life / 2.2));
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

  // build tag owned by v43 — do not set here
  console.log("[DeadSignal] v41 credits+fall+holes+limbs");
})();
