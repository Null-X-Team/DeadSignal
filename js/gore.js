(function () {
  "use strict";
  var FLOOR_Y = 548;
  function wait() {
    if (!window.__deadSignal) {
      requestAnimationFrame(wait);
      return;
    }
    patch(window.__deadSignal);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 3, w / 2, h / 2));
    ctx.beginPath();
    if (ctx.roundRect) {
      try {
        ctx.roundRect(x, y, w, h, r);
      } catch (e) {
        ctx.rect(x, y, w, h);
      }
    } else ctx.rect(x, y, w, h);
    ctx.fill();
  }
  function mixSkin(color) {
    if (color === "#ff7d78" || color === "#e35d6a") return "#c98a84";
    if (color === "#f2b7ff" || color === "#c9d2dc") return "#c9b4c4";
    return "#8fbfa8";
  }
  function patch(g) {
    if (g.__gorePatched) return;
    g.__gorePatched = true;
    g.stains = g.stains || [];
    g.deathT = 0;
    g.deathDone = false;

    function burstBlood(x, y, n, p) {
      var colors = ["#6b0000", "#8b0a1a", "#c41e3a", "#e35d6a", "#4a0000", "#9b1b2f"];
      for (var i = 0; i < n; i++) {
        g.particles.push({
          x: x + rand(-8, 8),
          y: y + rand(-12, 6),
          vx: rand(-p, p) * 0.55,
          vy: rand(-p * 0.35, p * 0.15),
          life: rand(0.35, 1.1),
          max: 1.1,
          size: rand(2, 7),
          color: colors[i % colors.length],
          gore: true
        });
      }
      for (var j = 0; j < Math.min(8, n); j++) {
        g.stains.push({
          x: x + rand(-40, 40),
          y: FLOOR_Y - 4 + rand(-2, 6),
          size: rand(8, 28),
          a: rand(0.35, 0.85)
        });
      }
      if (g.stains.length > 90) g.stains.splice(0, g.stains.length - 90);
    }

    g.die = function () {
      if (g.phase === "dying" || g.phase === "dead") return;
      g.phase = "dying";
      g.deathT = 0;
      g.deathDone = false;
      g.shopOpen = false;
      if (g.onShop) g.onShop(false);
      g.high = Math.max(g.high, g.score);
      try {
        localStorage.setItem("deadSignalHigh", String(g.high));
      } catch (e) {}
      g.player.vx = 0;
      g.player.hurt = 1;
      g.trauma = 1;
      g.__deathX = g.player.x;
      g.__deathY = g.player.y;
      g.player.y = -9999;
      g.say("THEY HAVE YOU", 2.5);
      burstBlood(g.__deathX, g.__deathY - 10, 28, 220);
      burstBlood(g.__deathX, g.__deathY, 18, 140);
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i];
        if (!e.dead) {
          e.feast = true;
          e.vx = 0;
          e.knock = 0;
        }
      }
    };

    var origKill = g.kill.bind(g);
    g.kill = function (e) {
      if (e.dead) return;
      origKill(e);
      burstBlood(e.x, e.y - 8, 22, 200);
      burstBlood(e.x, e.y + 10, 10, 90);
      g.trauma = Math.min(1, g.trauma + 0.18);
    };

    var origHurt = g.hurt.bind(g);
    g.hurt = function (n) {
      if (g.player.hurt > 0) return;
      origHurt(n);
      if (g.phase === "dying") return;
      burstBlood(g.player.x, g.player.y - 6, 10, 140);
    };

    var origStart = g.startRun.bind(g);
    g.startRun = function () {
      g.stains = [];
      g.deathT = 0;
      g.deathDone = false;
      g.__deathX = null;
      origStart();
    };

    var origUpdate = g.update.bind(g);
    g.update = function (dt) {
      if (g.phase === "dying") {
        if (g.msgT > 0) {
          g.msgT -= dt;
          if (g.msgT <= 0) g.msg = "";
        }
        g.trauma = Math.max(0, g.trauma - dt * 1.2);
        g.flash = Math.max(0, g.flash - dt);
        g.pushHud();
        return;
      }
      origUpdate(dt);
    };

    var last = performance.now();
    function goreTick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try {
        if (g.phase === "dying") {
          g.deathT += dt;
          g.trauma = Math.max(0.35, g.trauma - dt * 0.12);
          for (var i = 0; i < g.enemies.length; i++) {
            var e = g.enemies[i];
            if (e.dead || !e.feast) continue;
            var dx = (g.__deathX != null ? g.__deathX : g.player.x) - e.x;
            var dist = Math.abs(dx);
            e.facing = dx >= 0 ? 1 : -1;
            if (dist > 28) {
              e.x += (dx > 0 ? 1 : -1) * Math.min(130 * dt, dist);
              e.step += dt * 8;
            } else {
              e.eating = true;
              e.step += dt * 10;
              if (Math.random() < 0.35) {
                burstBlood(
                  (g.__deathX != null ? g.__deathX : g.player.x) + rand(-18, 18),
                  (g.__deathY != null ? g.__deathY : g.player.y) + rand(-6, 14),
                  3,
                  70
                );
              }
            }
          }
          if (g.deathT > 1.2 && g.deathT < 3.8 && Math.random() < 0.28) {
            g.particles.push({
              x: (g.__deathX != null ? g.__deathX : g.player.x) + rand(-20, 20),
              y: (g.__deathY != null ? g.__deathY : g.player.y) + rand(-10, 20),
              vx: rand(-60, 60),
              vy: rand(-40, 20),
              life: rand(0.4, 0.9),
              max: 0.9,
              size: rand(3, 9),
              color: Math.random() < 0.5 ? "#6b0000" : "#c41e3a",
              gore: true
            });
          }
          for (var p = 0; p < g.particles.length; p++) {
            var pt = g.particles[p];
            if (pt.gore) pt.vy += 180 * dt;
          }
          if (g.deathT >= 4.2 && !g.deathDone) {
            g.deathDone = true;
            g.phase = "dead";
            g.say("SIGNAL LOST", 4);
            g.pushHud();
          }
        }
        for (var k = 0; k < g.particles.length; k++) {
          var q = g.particles[k];
          if (q.gore) {
            if (q.y > FLOOR_Y - 2) {
              q.y = FLOOR_Y - 2;
              q.vy *= -0.12;
              q.vx *= 0.55;
            }
          }
        }
        paintOverlay(g);
      } catch (err) {
        console.error(err);
      }
      requestAnimationFrame(goreTick);
    }
    requestAnimationFrame(goreTick);
  }

  function paintOverlay(g) {
    var ctx = g.ctx;
    if (!ctx) return;
    var cam = g.camX || 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-cam, 0);
    if (g.stains) {
      for (var i = 0; i < g.stains.length; i++) {
        var s = g.stains[i];
        ctx.fillStyle = "rgba(70,0,8," + s.a + ")";
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.size, s.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (g.phase === "dying" || g.phase === "dead") {
      drawDeadPlayer(ctx, g);
      for (var j = 0; j < g.enemies.length; j++) {
        var e = g.enemies[j];
        if (e.feast || e.eating) drawFeast(ctx, e);
      }
    }
    for (var p = 0; p < g.particles.length; p++) {
      var pt = g.particles[p];
      if (!pt.gore) continue;
      ctx.globalAlpha = Math.max(0, pt.life / (pt.max || 1));
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.ellipse(
        pt.x,
        pt.y,
        pt.size * 0.7,
        pt.size * 1.1,
        Math.atan2(pt.vy, pt.vx || 0.01),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawDeadPlayer(ctx, g) {
    var p = g.player;
    var px = g.__deathX != null ? g.__deathX : p.x;
    var py = g.__deathY != null ? g.__deathY : p.y;
    var t = g.deathT || 0;
    var fall = Math.min(1, t / 0.55);
    var tear = Math.max(0, Math.min(1, (t - 1.1) / 2.4));
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(px, FLOOR_Y - 4, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(px, py + 18 * fall);
    ctx.rotate((-Math.PI / 2) * fall * p.facing);
    ctx.scale(p.facing, 1);
    var skin = "#c9a090";
    var suit = "#a07080";
    var shade = "#3a1a22";
    ctx.fillStyle = shade;
    rr(ctx, -18, 6, 12, 22, 4);
    rr(ctx, 6, 8, 12, 22, 4);
    ctx.fillStyle = "#120816";
    rr(ctx, -20, 24, 14, 7, 2);
    rr(ctx, 8, 26, 14, 7, 2);
    ctx.fillStyle = suit;
    rr(ctx, -14, -20, 28, 32, 6);
    ctx.fillStyle = "#4a1020";
    rr(ctx, -10, -14, 20, 18, 4);
    ctx.fillStyle = "rgba(120,0,10," + (0.35 + tear * 0.55) + ")";
    rr(ctx, -8, -12, 16 + tear * 8, 14 + tear * 10, 5);
    ctx.fillStyle = suit;
    rr(ctx, -28, -16, 16, 8, 3);
    rr(ctx, 14, -10, 18, 8, 3);
    ctx.fillStyle = skin;
    rr(ctx, -34, -18, 10, 8, 3);
    rr(ctx, 28, -12, 10, 8, 3);
    rr(ctx, -10, -42, 18, 18, 8);
    ctx.fillStyle = "#0b0814";
    rr(ctx, -12, -46, 22, 12, 5);
    if (tear > 0.2) {
      ctx.fillStyle = "#6b0000";
      rr(ctx, -6 + tear * 30, -8, 8, 6, 2);
      rr(ctx, 4 - tear * 25, 4, 7, 5, 2);
      ctx.fillStyle = "#c41e3a";
      rr(ctx, -2, -4 + tear * 12, 6, 4, 2);
    }
    if (tear > 0.55) {
      ctx.fillStyle = "#4a0000";
      rr(ctx, -12, -6, 10, 8, 3);
      rr(ctx, 4, -4, 12, 9, 3);
    }
    ctx.restore();
    ctx.fillStyle = "rgba(80,0,8," + (0.25 + Math.min(0.55, t * 0.15)) + ")";
    ctx.beginPath();
    ctx.ellipse(px, FLOOR_Y - 2, 28 + t * 10, 8 + t * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFeast(ctx, e) {
    var s = e.type === "brute" ? 1.2 : e.type === "runner" ? 0.9 : 1;
    var body = e.color || "#7ee8d4";
    var dark = "#150a1c";
    var skin = mixSkin(body);
    var kneel = e.eating ? 1 : 0.65;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(e.x, FLOOR_Y - 4, 18 * s, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(e.x, e.y + 10 * kneel);
    ctx.scale(e.facing * s, s);
    ctx.fillStyle = dark;
    rr(ctx, -14, 14, 10, 14, 3);
    rr(ctx, 4, 14, 10, 14, 3);
    ctx.fillStyle = "#2a1a1c";
    rr(ctx, -16, 24, 12, 6, 2);
    rr(ctx, 6, 24, 12, 6, 2);
    ctx.save();
    ctx.translate(0, 8);
    ctx.rotate(0.85);
    ctx.fillStyle = body;
    ctx.shadowColor = body;
    ctx.shadowBlur = 8;
    rr(ctx, -12, -22, 24, 30, 7);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    rr(ctx, -7, -14, 14, 16, 4);
    ctx.fillStyle = body;
    rr(ctx, -16, -6, 10, 18, 4);
    rr(ctx, 6, -4, 10, 18, 4);
    ctx.fillStyle = skin;
    rr(ctx, -18, 10, 9, 10, 3);
    rr(ctx, 8, 12, 9, 10, 3);
    rr(ctx, -6, -40, 16, 18, 7);
    ctx.fillStyle = dark;
    rr(ctx, -4, -34, 14, 7, 3);
    ctx.fillStyle = "#ff4c70";
    rr(ctx, 4, -32, 5, 3, 1);
    if (e.eating) {
      var chomp = (Math.sin(e.step) + 1) * 0.5;
      ctx.fillStyle = "#4a0000";
      rr(ctx, -2, -28 + chomp * 3, 12, 6, 2);
      ctx.fillStyle = "#c41e3a";
      rr(ctx, 0, -24, 8, 4, 1);
    }
    ctx.restore();
    ctx.restore();
  }

  wait();
})();
