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
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 3, w / 2, h / 2));
    ctx.beginPath();
    if (ctx.roundRect) {
      try {
        ctx.roundRect(x, y, w, h, r);
      } catch (err) {
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
    if (g.__polish) return;
    g.__polish = true;
    g.player.r = 38;
    g.player.y = FLOOR_Y - 58;

    g.kill = function (e) {
      if (e.dead) return;
      e.dead = true;
      e.fallT = 0;
      e.corpseT = 3.2;
      e.vx = (Math.random() - 0.5) * 90;
      g.score += e.score;
      g.credits += e.score;
      g.sfx.hit();
      g.burst(e.x, e.y, e.color, 16, 190);
      g.burst(e.x, e.y - 6, "#8b0a1a", 12, 150);
      if (Math.random() < 0.16) {
        var w = g.weapon();
        w.reserve += w.id === "pistol" ? 6 : 3;
        g.say("+ AMMO", 0.35);
      }
    };

    var origUpdate = g.update.bind(g);
    g.update = function (dt) {
      var before = g.enemies.slice();
      origUpdate(dt);
      for (var i = 0; i < before.length; i++) {
        var e = before[i];
        if (!e.dead) continue;
        e.fallT = (e.fallT || 0) + dt;
        e.corpseT = (e.corpseT || 0) - dt;
        e.x += (e.vx || 0) * dt;
        e.vx *= Math.pow(1e-3, dt);
        if (e.corpseT > 0 && g.enemies.indexOf(e) < 0) g.enemies.push(e);
      }
      g.enemies = g.enemies.filter(function (e) {
        return !e.dead || (e.corpseT || 0) > 0;
      });
      if (g.phase === "combat" || g.phase === "intermission") {
        g.player.y = FLOOR_Y - 58;
      }
    };

    var origSpawn = g.spawnFromDoor.bind(g);
    g.spawnFromDoor = function () {
      origSpawn();
      var e = g.enemies[g.enemies.length - 1];
      if (!e) return;
      if (e.type === "brute") {
        e.r = 52;
        e.y = FLOOR_Y - 70;
      } else if (e.type === "runner") {
        e.r = 32;
        e.y = FLOOR_Y - 58;
      } else {
        e.r = 38;
        e.y = FLOOR_Y - 58;
      }
    };

    var origStart = g.startRun.bind(g);
    g.startRun = function () {
      origStart();
      g.player.r = 38;
      g.player.y = FLOOR_Y - 58;
    };

    function tick() {
      try {
        paint(g);
      } catch (err) {
        console.error(err);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function paint(g) {
    var ctx = g.ctx;
    if (!ctx) return;
    var cam = g.camX || 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-cam, 0);
    for (var i = 0; i < g.enemies.length; i++) {
      if (g.enemies[i].dead) drawCorpse(ctx, g.enemies[i]);
    }
    if (g.player.reload > 0 && g.phase !== "menu" && g.phase !== "dead" && g.phase !== "dying") {
      var p = g.player;
      ctx.fillStyle = "rgba(126,232,212,0.95)";
      ctx.font = "700 12px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("RELOAD", p.x, p.y - 70);
      var prog = 1 - p.reload / Math.max(0.01, g.weapon().reload);
      ctx.fillStyle = "#1a1028";
      ctx.fillRect(p.x + p.facing * 28, p.y - 20 - prog * 10, 8, 14);
      ctx.fillStyle = g.weapon().color;
      ctx.fillRect(p.x + p.facing * 29, p.y - 18 - prog * 10, 6, 4);
    }
    ctx.restore();
  }

  function drawCorpse(ctx, e) {
    var fall = Math.min(1, (e.fallT || 0) / 0.4);
    var s = e.type === "brute" ? 1.55 : e.type === "runner" ? 1.15 : 1.35;
    var body = e.color || "#7ee8d4";
    var dark = "#150a1c";
    var skin = mixSkin(body);
    var fade = Math.max(0.35, Math.min(1, (e.corpseT || 0) / 0.6));
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(e.x, FLOOR_Y - 4, 28 * s, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(e.x, FLOOR_Y - 10);
    ctx.rotate((e.facing || 1) * (Math.PI / 2) * fall);
    ctx.scale(s, s);
    ctx.fillStyle = dark;
    rr(ctx, -20, 4, 14, 12, 3);
    rr(ctx, 6, 6, 14, 12, 3);
    ctx.fillStyle = body;
    rr(ctx, -16, -14, 32, 24, 7);
    ctx.fillStyle = "rgba(90,0,12,0.65)";
    rr(ctx, -10, -8, 18, 12, 4);
    ctx.fillStyle = skin;
    rr(ctx, -10, -30, 18, 16, 7);
    ctx.fillStyle = dark;
    rr(ctx, -8, -26, 14, 7, 2);
    ctx.fillStyle = "#ff4c70";
    rr(ctx, 4, -24, 5, 3, 1);
    ctx.fillStyle = body;
    rr(ctx, -28, -6, 14, 7, 3);
    rr(ctx, 14, -4, 16, 7, 3);
    ctx.fillStyle = skin;
    rr(ctx, -34, -8, 9, 7, 3);
    rr(ctx, 26, -6, 9, 7, 3);
    ctx.restore();
    ctx.fillStyle = "rgba(70,0,8," + (0.25 + fall * 0.4) + ")";
    ctx.beginPath();
    ctx.ellipse(e.x, FLOOR_Y - 2, 26 + fall * 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  wait();
})();
