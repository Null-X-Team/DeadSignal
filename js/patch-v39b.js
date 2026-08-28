// DeadSignal v39b — ensure overlay draws even if engine uses loop/drawWorld
(function () {
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
  function overlay(g) {
    var ctx = g.ctx;
    if (!ctx) return;
    var cam = g.camX || 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-cam, 0);
    if (g.player && (g.player.legKickT || 0) > 0) {
      var pl = g.player;
      var ext = (1 - Math.abs(pl.legKickT / 0.42 - 0.45) * 1.4) * 36;
      ctx.save();
      ctx.translate(pl.x, FLOOR_Y - 6);
      ctx.scale(pl.facing || 1, 1);
      ctx.fillStyle = "#3b2a52";
      rr(ctx, 8, -18, 12, 10, 3);
      ctx.fillStyle = "#120816";
      rr(ctx, 8 + ext, -16, 16, 9, 3);
      ctx.restore();
    }
    if (g.enemies) {
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i];
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
          }
          ctx.restore();
        }
        if (e.dead) continue;
        if (e.noHead) {
          ctx.fillStyle = "#4a0000";
          rr(ctx, e.x - 8 * sc, e.y - (e.r || 24) * 1.05, 16 * sc, 10 * sc, 3);
        }
      }
    }
    if (g.flyParts) {
      for (var j = 0; j < g.flyParts.length; j++) {
        var fp = g.flyParts[j];
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.rotate(fp.rot || 0);
        ctx.globalAlpha = Math.max(0.25, Math.min(1, fp.life / 2));
        ctx.fillStyle = fp.color;
        rr(ctx, -fp.w / 2, -fp.h / 2, fp.w, fp.h, 3);
        if (fp.kind === "head") {
          ctx.fillStyle = "#150a1c";
          rr(ctx, -fp.w * 0.3, -fp.h * 0.25, fp.w * 0.7, fp.h * 0.35, 2);
        }
        ctx.fillStyle = "#8a1020";
        rr(ctx, -fp.w * 0.2, fp.h * 0.15, fp.w * 0.35, fp.h * 0.25, 2);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  function hook() {
    var g = window.__deadSignal;
    if (!g || !g.loop) { setTimeout(hook, 80); return; }
    if (g.__ds39b) return;
    g.__ds39b = true;
    var prev = g.loop.bind(g);
    g.loop = function (t) {
      prev(t);
      try { overlay(g); } catch (e) {}
    };
  }
  hook();
  console.log("[DeadSignal] v39b overlay loop");
})();
