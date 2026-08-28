// DeadSignal v36 — prone, eat-on-death, joints, head, arms down
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
  function groundShadow(ctx, x, s) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y + 2, s, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEatingZombie(ctx, e) {
    var s = e.sizeScale || 1;
    groundShadow(ctx, e.x, 22 * s);
    ctx.save();
    ctx.translate(e.x, FLOOR_Y - 8);
    ctx.scale(e.facing * s, s);
    var body = e.color || "#5a3a48", skin = "#c4a090", dark = "#150a1c";
    ctx.fillStyle = dark;
    rr(ctx, -18, -6, 10, 14, 3);
    rr(ctx, 6, -6, 10, 14, 3);
    ctx.fillStyle = "#2c2226";
    rr(ctx, -22, 4, 12, 8, 3);
    rr(ctx, 10, 4, 12, 8, 3);
    ctx.save();
    ctx.translate(0, -18);
    ctx.rotate(0.55);
    ctx.fillStyle = body;
    rr(ctx, -12, -8, 28, 18, 6);
    ctx.restore();
    ctx.fillStyle = skin;
    rr(ctx, 14, -28, 16, 14, 6);
    ctx.fillStyle = dark;
    rr(ctx, 16, -26, 12, 6, 2);
    ctx.fillStyle = body;
    rr(ctx, 8, -10, 8, 16, 3);
    rr(ctx, -6, -8, 8, 14, 3);
    ctx.fillStyle = skin;
    rr(ctx, 10, 4, 9, 8, 3);
    rr(ctx, -8, 4, 9, 8, 3);
    var t = e.eatT || 0;
    ctx.fillStyle = "#8a1020";
    ctx.globalAlpha = 0.5 + Math.sin(t * 10) * 0.3;
    rr(ctx, 20, -18, 6, 4, 2);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawFallenPlayer(ctx, p) {
    groundShadow(ctx, p.x, 40);
    ctx.save();
    ctx.translate(p.x, FLOOR_Y - 4);
    ctx.scale(p.facing || 1, 1);
    ctx.fillStyle = "#d9cced";
    rr(ctx, -28, -10, 50, 14, 5);
    ctx.fillStyle = "#d7c4b0";
    rr(ctx, 22, -12, 14, 12, 6);
    ctx.fillStyle = "#0b0814";
    rr(ctx, 20, -16, 16, 8, 4);
    ctx.fillStyle = "#3b2a52";
    rr(ctx, -40, -6, 18, 8, 3);
    rr(ctx, -36, 2, 16, 7, 3);
    ctx.fillStyle = "#d9cced";
    rr(ctx, -10, -18, 20, 7, 3);
    rr(ctx, 5, 4, 18, 7, 3);
    ctx.restore();
  }

  function redrawProne(ctx, g) {
    var p = g.player, wpn = g.weapon(), SPRITES = window.DS_GUNS || {};
    var skin = "#d7c4b0", suit = "#d9cced", shade = "#3b2a52", boot = "#120816";
    groundShadow(ctx, p.x, 52);
    ctx.save();
    ctx.translate(p.x, FLOOR_Y - 6);
    ctx.scale(p.facing, 1);
    ctx.fillStyle = shade;
    rr(ctx, -70, -4, 48, 9, 4);
    ctx.fillStyle = "#5a4574";
    rr(ctx, -66, 4, 44, 8, 4);
    ctx.fillStyle = boot;
    rr(ctx, -78, -5, 12, 8, 2);
    rr(ctx, -74, 3, 12, 8, 2);
    ctx.fillStyle = suit;
    rr(ctx, -28, -6, 30, 14, 5);
    rr(ctx, -4, -10, 52, 14, 5);
    ctx.fillStyle = "#1a1028";
    rr(ctx, 4, -8, 36, 10, 3);
    ctx.strokeStyle = "#2a1a38";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(10, -8); ctx.lineTo(22, 4);
    ctx.moveTo(28, -8); ctx.lineTo(16, 4);
    ctx.stroke();
    ctx.strokeStyle = suit;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(12, -2); ctx.lineTo(48, -6);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, -5); ctx.lineTo(58, -7);
    ctx.stroke();
    ctx.fillStyle = skin;
    rr(ctx, 50, -16, 14, 12, 5);
    ctx.fillStyle = "#0b0814";
    rr(ctx, 48, -20, 16, 8, 4);
    var img = SPRITES[wpn.id] || SPRITES[wpn.hold] || SPRITES.sniper || SPRITES.lmg;
    if (img && img.complete && img.naturalWidth) {
      var h = 18, aspect = img.naturalWidth / img.naturalHeight, gw = Math.min(90, h * aspect);
      ctx.drawImage(img, 20, -14, gw, h);
    } else {
      ctx.fillStyle = wpn.color || "#6a7a88";
      rr(ctx, 18, -12, 70, 10, 3);
    }
    ctx.restore();
  }

  function paintArmsDown(ctx, e) {
    var s = e.sizeScale || 1;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.facing * s, s);
    var body = e.hit > 0 ? "#ffffff" : e.color;
    var skin = e.hit > 0 ? "#ffe8e8" : "#c4a090";
    ctx.fillStyle = body;
    rr(ctx, 6, -8, 8, 18, 3);
    ctx.fillStyle = skin;
    rr(ctx, 7, 8, 7, 12, 3);
    ctx.fillStyle = body;
    rr(ctx, -12, -6, 8, 16, 3);
    ctx.fillStyle = skin;
    rr(ctx, -11, 8, 7, 11, 3);
    ctx.restore();
  }

  var origUpdate = proto.update;
  proto.update = function (dt) {
    if (this.phase === "dead" && this.enemies) {
      var px = this.player.x;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.dead) continue;
        var dx = px - e.x;
        if (Math.abs(dx) > 30) {
          e.facing = dx > 0 ? 1 : -1;
          var spd = (e.speed || 55) * (e.brokenL || e.brokenR ? 0.4 : 1.2);
          e.x += Math.sign(dx) * spd * dt;
          e.step = (e.step || 0) + dt * 9;
          e.eating = false;
        } else {
          e.eating = true;
          e.eatT = (e.eatT || 0) + dt;
        }
      }
    }
    origUpdate.call(this, dt);
    if (!this.enemies || !this.bullets) return;
    for (var bi = 0; bi < this.bullets.length; bi++) {
      var b = this.bullets[bi];
      for (var ei = 0; ei < this.enemies.length; ei++) {
        var en = this.enemies[ei];
        if (en.dead) continue;
        var dx2 = b.x - en.x;
        var sc = en.sizeScale || 1;
        var headY = en.y - en.r * 1.15 * sc;
        var headR = en.r * 0.45 * sc;
        var hy = b.y - headY;
        if (dx2 * dx2 + hy * hy < (headR + b.r) * (headR + b.r)) {
          en.hp -= b.damage * 2.2;
          en.hit = 0.2;
          b.life = 0;
          if (en.hp <= 0) this.kill(en);
          continue;
        }
        var kneeY = en.y + en.r * 0.55 * sc;
        if (Math.abs(dx2) < en.r * 0.9 + b.r && Math.abs(b.y - kneeY) < 14 * sc) {
          var left = dx2 * en.facing < 0;
          if (left && !en.brokenL) {
            en.brokenL = true; en.hit = 0.25;
            this.say("LEG SHOT", 0.5);
            this.burst && this.burst(en.x, kneeY, "#8a1020", 8, 120);
          } else if (!left && !en.brokenR) {
            en.brokenR = true; en.hit = 0.25;
            this.say("LEG SHOT", 0.5);
            this.burst && this.burst(en.x, kneeY, "#8a1020", 8, 120);
          }
          en.hp -= b.damage * 0.7;
          b.life = 0;
          if (en.hp <= 0) this.kill(en);
        }
      }
    }
  };

  var _die = proto.die;
  proto.die = function () {
    _die.call(this);
    if (this.enemies) {
      for (var i = 0; i < this.enemies.length; i++) {
        this.enemies[i].eating = false;
        this.enemies[i].eatT = 0;
      }
    }
  };

  var _draw = proto.draw;
  proto.draw = function (ctx) {
    _draw.call(this, ctx);
    try {
      var w = this.weapon && this.weapon();
      if (w && w.prone && this.phase !== "dead" && this.player) {
        if (!((this.player.kick || 0) > 0)) redrawProne(ctx, this);
      }
      if (this.enemies) {
        for (var i = 0; i < this.enemies.length; i++) {
          var e = this.enemies[i];
          if (e.dead) continue;
          if (e.eating) drawEatingZombie(ctx, e);
          else paintArmsDown(ctx, e);
          if (e.brokenL || e.brokenR) {
            ctx.save();
            ctx.strokeStyle = "#8a1020";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            var sc = e.sizeScale || 1;
            if (e.brokenL) {
              ctx.beginPath();
              ctx.moveTo(e.x - 6 * e.facing * sc, e.y + 8 * sc);
              ctx.lineTo(e.x - 4 * e.facing * sc, FLOOR_Y - 2);
              ctx.stroke();
            }
            if (e.brokenR) {
              ctx.beginPath();
              ctx.moveTo(e.x + 6 * e.facing * sc, e.y + 8 * sc);
              ctx.lineTo(e.x + 4 * e.facing * sc, FLOOR_Y - 2);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }
      if (this.phase === "dead" && this.player) drawFallenPlayer(ctx, this.player);
    } catch (err) {
      console.warn(err);
    }
  };

  console.log("[DeadSignal] v36 combat anim + joints");
})();
