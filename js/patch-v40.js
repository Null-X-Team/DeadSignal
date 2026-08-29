// DeadSignal v40 — real kick (not hatchet), shotgun falloff, gun ratios, flying limbs
// BUILD tag is owned by latest patch (v41+) — this file no longer sets it
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

  function getEngine() {
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

  function burst(eng, x, y, n, power) {
    if (!eng.particles) eng.particles = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 30 + Math.random() * power;
      eng.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.3 + Math.random() * 0.5, max: 0.9,
        size: 2 + Math.random() * 4,
        color: Math.random() < 0.4 ? "#4a0810" : "#8a1020"
      });
    }
  }

  function flyPart(eng, e, kind, wx, wy) {
    if (!eng.flyParts) eng.flyParts = [];
    var s = e.sizeScale || 1;
    var dims = { head: [16 * s, 16 * s], arm: [8 * s, 18 * s], leg: [9 * s, 20 * s] }[kind] || [12 * s, 14 * s];
    var dir = Math.sign(e.x - (eng.player ? eng.player.x : e.x)) || 1;
    eng.flyParts.push({
      kind: kind, x: wx, y: wy,
      vx: dir * (120 + Math.random() * 160),
      vy: -140 - Math.random() * 120,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
      w: dims[0], h: dims[1],
      color: kind === "head" ? "#c4a090" : (e.color || "#5a3a48"),
      life: 5 + Math.random() * 2
    });
    burst(eng, wx, wy, 10, 140);
  }

  function addHole(e, hx, hy) {
    if (!e.holes) e.holes = [];
    e.holes.push({
      x: (hx - e.x) * (e.facing || 1),
      y: hy - e.y,
      r: 3 + Math.random() * 4
    });
    if (e.holes.length > 20) e.holes.shift();
  }

  // Space = real kick (not hatchet)
  proto.legKick = function () {
    if (!this.player) return;
    if ((this.player.legKickT || 0) > 0) return;
    this.player.legKickT = 0.42;
    this.player.kick = 0; // do not trigger hatchet visual
    var px = this.player.x;
    var facing = this.player.facing || 1;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var dx = e.x - px;
      if (dx * facing < 0) continue;
      if (Math.abs(dx) < 70 && Math.abs(e.y - this.player.y) < 50) {
        e.hp -= 22;
        if (!(e.sizeScale > 1.15)) e.x += facing * 28;
        burst(this, e.x, e.y, 8, 100);
        if (e.hp <= 0) this.kill(e);
      }
    }
  };

  // shotgun closer = more damage (falloff)
  var _fire = proto.fire;
  if (typeof _fire === "function") {
    proto.fire = function () {
      var w = this.weapon && this.weapon();
      var before = (this.bullets || []).length;
      var r = _fire.apply(this, arguments);
      if (w && (w.id === "pump" || w.id === "shotgun" || /mossberg|590/i.test(w.name || ""))) {
        for (var i = before; i < (this.bullets || []).length; i++) {
          var b = this.bullets[i];
          b._shotgun = true;
          b._baseDmg = b.damage || 12;
          b._originX = this.player ? this.player.x : b.x;
        }
      }
      return r;
    };
  }

  var _update = proto.update;
  proto.update = function (dt) {
    if (this.player && this.player.legKickT > 0) this.player.legKickT = Math.max(0, this.player.legKickT - dt);
    if (this.bullets) {
      for (var bi = 0; bi < this.bullets.length; bi++) {
        var b = this.bullets[bi];
        if (b._shotgun && b._baseDmg != null) {
          var dist = Math.abs(b.x - (b._originX || b.x));
          b.damage = b._baseDmg * Math.max(0.25, 1 - dist / 170);
        }
      }
    }
    if (typeof _update === "function") _update.call(this, dt);
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
          p.vy *= -0.3;
          p.vx *= 0.6;
          if (Math.abs(p.vy) < 24) p.vy = 0;
        }
        p.life -= dt;
      }
      this.flyParts = this.flyParts.filter(function (p) { return p.life > 0; });
    }
  };

  // bind Space to legKick
  var _bind = proto.bind;
  if (typeof _bind === "function") {
    proto.bind = function () {
      _bind.apply(this, arguments);
      var self = this;
      window.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
          e.preventDefault();
          self.legKick && self.legKick();
        }
      }, true);
    };
  } else {
    window.addEventListener("keydown", function (e) {
      if (e.code === "Space") {
        e.preventDefault();
        var g = getEngine();
        if (g && g.legKick) g.legKick();
      }
    }, true);
  }

  console.log("[DeadSignal] v40 kick/shotgun/limbs/gun-scale");
})();
