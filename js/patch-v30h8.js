// DeadSignal patch v30h8 — hatchet, leg hits, stretched prone redraw
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) {
    console.warn("[DeadSignal] patch-v30h8: Engine missing");
    return;
  }
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;
  var VIEW_W = 1280;
  var VIEW_H = 720;

  function rr(ctx, x, y, w, h, r) {
    r = r || 3;
    if (!(w > 0) || !(h > 0)) return;
    var rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      try { ctx.roundRect(x, y, w, h, rad); } catch (e) { ctx.rect(x, y, w, h); }
    } else { ctx.rect(x, y, w, h); }
    ctx.fill();
  }

  // --- Fast hatchet with real hitbox + light knockback ---
  proto.swingHatchet = function () {
    if (this.phase !== "combat" && this.phase !== "intermission") return;
    if (this.player.kick > 0 || this.shopOpen) return;
    this.player.kick = 0.32;
    this.trauma = Math.min(1, this.trauma + 0.22);
    this.say("HATCHET", 0.22);
    var facing = this.player.facing;
    var reach = 92;
    var boxL = Math.min(this.player.x, this.player.x + facing * reach) - 6;
    var boxR = Math.max(this.player.x, this.player.x + facing * reach) + 6;
    var boxT = this.player.y - 52;
    var boxB = FLOOR_Y + 4;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var bodyY = e.y;
      var hitX = e.x;
      var inX = hitX + e.r * 0.55 >= boxL && hitX - e.r * 0.55 <= boxR;
      var inBodyY = bodyY >= boxT && bodyY <= boxB;
      var inLegY = FLOOR_Y >= boxT && FLOOR_Y <= boxB + 8;
      if (!inX || !(inBodyY || inLegY)) continue;
      if (Math.sign((e.x - this.player.x) || facing) !== facing) continue;
      var d = Math.abs(e.x - this.player.x);
      var f = Math.max(0.15, (reach - d) / reach);
      var kb = e.size === "tall" ? 160 : 380;
      e.vx += facing * kb * f;
      e.knock = e.size === "tall" ? 0.12 : 0.28;
      var hd = 42;
      if ((e.armor || 0) > 0) hd = Math.max(8, hd - Math.floor(e.armor * 0.55));
      e.hp -= hd;
      e.hit = 0.18;
      this.bloodHit(e.x, e.y - 8);
      if (e.hp <= 0) this.kill(e);
    }
  };

  // --- Leg hitboxes for bullets ---
  var _update = proto.update;
  proto.update = function (dt) {
    _update.call(this, dt);
    for (var bi = 0; bi < this.bullets.length; bi++) {
      var b = this.bullets[bi];
      if (b._legChecked) continue;
      b._legChecked = true;
      for (var ei = 0; ei < this.enemies.length; ei++) {
        var e = this.enemies[ei];
        if (e.dead) continue;
        var dx = b.x - e.x;
        var dy = b.y - e.y;
        var hit = e.r + b.r;
        var bodyHit = dx * dx + dy * dy < hit * hit;
        var legTop = e.y - e.r * 0.15;
        var legHit = Math.abs(dx) < e.r * 0.8 + b.r && b.y >= legTop && b.y <= FLOOR_Y + 6;
        if (!bodyHit && legHit) {
          var dmg = b.damage;
          if ((e.armor || 0) > 0 && !b.pierce) dmg = Math.max(1, dmg - e.armor);
          e.hp -= dmg;
          e.hit = 0.12;
          if (e.size !== "tall") {
            e.vx += Math.sign(b.vx) * (b.pierce ? 160 : 110);
            e.knock = 0.1;
          }
          b.life = 0;
          this.burst(b.x, b.y, b.color, 5, 90);
          this.bloodHit(b.x, b.y);
          if (e.hp <= 0) this.kill(e);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter(function (b) { return b.life > 0; });
    try {
      var w = this.weapon && this.weapon();
      if (w && w.prone && !w.melee && this.player) this.player.y = FLOOR_Y - 12;
    } catch (err) {}
  };

  function drawStretchedProne(ctx, g) {
    var p = g.player;
    var wpn = g.weapon();
    if (!wpn || !wpn.prone || wpn.melee) return;
    if ((p.kick || 0) > 0) return;
    var cam = g.camX || 0;
    var SPRITES = window.DS_GUNS || {};
    var hurt = p.hurt > 0;
    var skin = hurt ? "#e8a8ae" : "#d7c4b0";
    var suit = hurt ? "#ff8097" : "#d9cced";
    var shade = hurt ? "#8a3a42" : "#3b2a52";
    var boot = "#120816";
    var H = { len: 74, gripX: 0.13, gripY: 0.48 };
    if (wpn.hold === "lmg") H = { len: 58, gripX: 0.22, gripY: 0.52 };

    ctx.save();
    ctx.translate(p.x - cam, p.y);
    ctx.scale(p.facing, 1);

    ctx.fillStyle = "#0e0918";
    ctx.fillRect(-55, -28, 120, 44);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 48, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(-20, 12);
    ctx.rotate(0.05);
    ctx.fillStyle = shade;
    rr(ctx, -42, -3, 46, 8, 4);
    ctx.fillStyle = boot;
    rr(ctx, -50, -4, 12, 7, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(-12, 14);
    ctx.rotate(0.08);
    ctx.fillStyle = "#5a4574";
    rr(ctx, -40, -3, 44, 8, 4);
    ctx.fillStyle = boot;
    rr(ctx, -48, -4, 12, 7, 2);
    ctx.restore();

    ctx.fillStyle = suit;
    rr(ctx, -24, 6, 38, 11, 5);

    ctx.save();
    ctx.translate(8, 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = suit;
    rr(ctx, -12, -5, 48, 12, 5);
    ctx.fillStyle = "#1a1028";
    rr(ctx, -6, -3, 38, 9, 3);
    ctx.strokeStyle = "#2a1a38";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, -3); ctx.lineTo(16, 9);
    ctx.moveTo(20, -3); ctx.lineTo(10, 9);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(40, -2);
    ctx.rotate(-0.06);
    ctx.fillStyle = skin;
    rr(ctx, -6, -7, 15, 13, 6);
    ctx.fillStyle = "#0b0814";
    rr(ctx, -8, -11, 17, 9, 5);
    ctx.fillStyle = wpn.color;
    ctx.globalAlpha = 0.85;
    rr(ctx, 2, -5, 9, 5, 2);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(18, 2);
    var lift = Math.max(-0.4, Math.min(0.4, p.aimLift || 0));
    ctx.rotate(lift * 0.25);
    ctx.strokeStyle = suit;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    var handX = 26, handY = 0;
    var gspr = SPRITES[wpn.id] || SPRITES[wpn.hold];
    var gw = H.len, gh = H.len * 0.28;
    if (gspr && gspr.complete && (gspr.naturalWidth || 0) > 0) {
      gh = H.len * (gspr.naturalHeight / gspr.naturalWidth);
      ctx.drawImage(gspr, handX - H.gripX * gw, handY - H.gripY * gh, gw, gh);
    } else {
      ctx.fillStyle = wpn.color;
      rr(ctx, handX, -5, H.len * 0.85, 8, 2);
    }
    ctx.fillStyle = "#2a2a30";
    rr(ctx, handX + gw * 0.55, 8, 3, 10, 1);
    rr(ctx, handX + gw * 0.62, 8, 3, 10, 1);
    ctx.fillStyle = skin;
    rr(ctx, handX + gw * 0.4, 1, 11, 7, 3);
    ctx.restore();
    ctx.restore();
  }

  var _bind = proto.bind;
  proto.bind = function () {
    _bind.call(this);
    var self = this;
    var prevLoop = this.loop;
    this.loop = function (t) {
      prevLoop.call(self, t);
      try {
        if (self.ctx && self.player) drawStretchedProne(self.ctx, self);
      } catch (err) {}
    };
  };

  console.log("[DeadSignal] patch-v30h8 applied");
})();
