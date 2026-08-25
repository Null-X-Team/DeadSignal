// DeadSignal v31 — pause, progressive difficulty, supplies, stretched prone
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) {
    console.warn("[DeadSignal] v31: Engine missing");
    return;
  }
  var proto = G.Engine.prototype;
  var FLOOR_Y = 548;

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

  var _buy = proto.buy;
  proto.buy = function (item) {
    if (typeof item === "string") {
      var items = this.shopItems ? this.shopItems() : [];
      item = items.find(function (x) { return x.id === item; }) || item;
    }
    if (!item || typeof item !== "object") return "Unknown item.";
    return _buy.call(this, item);
  };

  var _spawn = proto.spawnFromDoor;
  proto.spawnFromDoor = function () {
    _spawn.call(this);
    var e = this.enemies[this.enemies.length - 1];
    if (!e || e.dead) return;
    var w = Math.max(1, this.wave || 1);
    var hpMul = 1 + Math.min(2.2, (w - 1) * 0.06);
    var spdMul = 1 + Math.min(1.4, (w - 1) * 0.035);
    var dmgMul = 1 + Math.min(1.8, (w - 1) * 0.04);
    e.maxHp = Math.round(e.maxHp * hpMul);
    e.hp = e.maxHp;
    e.speed = e.speed * spdMul;
    e.damage = Math.max(1, Math.round(e.damage * dmgMul));
    e.score = Math.round(e.score * (1 + (w - 1) * 0.03));
  };

  var _beginWave = proto.beginWave;
  proto.beginWave = function () {
    _beginWave.call(this);
    this.toSpawn = Math.max(this.toSpawn, 6 + this.wave * 3 + Math.floor(this.wave / 3));
    this.spawnTimer = Math.max(0.18, 0.72 - this.wave * 0.04);
  };

  proto.swingHatchet = function () {
    if (this.phase !== "combat" && this.phase !== "intermission") return;
    if (this.paused) return;
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
      var hitX = e.x;
      var inX = hitX + e.r * 0.55 >= boxL && hitX - e.r * 0.55 <= boxR;
      var inBodyY = e.y >= boxT && e.y <= boxB;
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

  proto.togglePause = function () {
    if (this.phase === "menu" || this.phase === "dead") return;
    if (this.shopOpen) { this.closeShop(); return; }
    this.paused = !this.paused;
    if (this.paused) {
      this.say("PAUSED — ESC to resume", 99);
      this.keys.clear();
      this.mouse.down = false;
      showPauseUI(true);
    } else {
      this.say("", 0);
      showPauseUI(false);
    }
    this.pushHud();
  };

  function showPauseUI(on) {
    var el = document.getElementById("pause-menu");
    if (!el) {
      el = document.createElement("div");
      el.id = "pause-menu";
      el.innerHTML =
        '<div class="pause-card" style="background:#12081c;border:1px solid rgba(126,232,212,0.35);border-radius:12px;padding:28px 32px;min-width:280px;text-align:center;color:#e8e0f0;">' +
        '<div class="label cyan">Signal suspended</div>' +
        "<h2>PAUSED</h2>" +
        '<p class="subtitle">Wave in progress. ESC resumes.</p>' +
        '<button type="button" class="primary-btn" id="pause-resume">Resume</button>' +
        '<button type="button" class="ghost-btn" id="pause-quit" style="margin-top:10px">Abort run</button>' +
        "</div>";
      el.style.cssText =
        "position:absolute;inset:0;z-index:40;display:none;align-items:center;justify-content:center;" +
        "background:rgba(6,4,12,0.72);backdrop-filter:blur(4px);";
      var shell = document.getElementById("game-shell") || document.body;
      shell.appendChild(el);
      el.querySelector("#pause-resume").addEventListener("click", function () {
        if (window.__deadSignal) window.__deadSignal.togglePause();
      });
      el.querySelector("#pause-quit").addEventListener("click", function () {
        var g = window.__deadSignal;
        if (!g) return;
        g.paused = false;
        showPauseUI(false);
        g.phase = "dead";
        g.say("SIGNAL LOST", 3);
        g.pushHud();
      });
    }
    el.style.display = on ? "flex" : "none";
  }

  var _update = proto.update;
  proto.update = function (dt) {
    if (this.paused) { this.pushHud(); return; }
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
      if (w && w.prone && !w.melee && this.player) this.player.y = FLOOR_Y - 14;
    } catch (err) {}
  };

  var _bind = proto.bind;
  proto.bind = function () {
    _bind.call(this);
    var self = this;
    self.paused = false;
    var onKey = function (e) {
      if (e.code === "Escape") {
        e.preventDefault();
        self.togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    var prevUnbind = self._unbind;
    self._unbind = function () {
      if (prevUnbind) prevUnbind();
      window.removeEventListener("keydown", onKey);
    };
    var prevLoop = this.loop;
    this.loop = function (t) {
      prevLoop.call(self, t);
      try {
        if (self.ctx && self.player && !self.paused) drawProneOnGround(self.ctx, self);
      } catch (err) {}
    };
  };

  function drawProneOnGround(ctx, g) {
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
    var isLmg = wpn.hold === "lmg" || wpn.id === "auto";
    var gunLen = isLmg ? 58 : 74;
    var gripX = isLmg ? 0.22 : 0.13;
    var gripY = isLmg ? 0.52 : 0.48;

    ctx.save();
    ctx.translate(p.x - cam, FLOOR_Y - 8);
    ctx.scale(p.facing, 1);

    ctx.fillStyle = "#0e0918";
    ctx.fillRect(-70, -40, 150, 50);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(10, 6, 52, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Standing silhouette rotated -90° onto the floor, gun forward
    ctx.save();
    ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = shade;
    rr(ctx, -5, 8, 10, 22, 4);
    ctx.fillStyle = boot;
    rr(ctx, -6, 28, 14, 7, 2);
    ctx.fillStyle = "#5a4574";
    rr(ctx, 2, 8, 10, 22, 4);
    ctx.fillStyle = boot;
    rr(ctx, 1, 28, 14, 7, 2);

    ctx.fillStyle = suit;
    rr(ctx, -13, -26, 28, 36, 6);
    ctx.fillStyle = "#1a1028";
    rr(ctx, -9, -20, 20, 26, 4);
    ctx.fillStyle = wpn.color;
    ctx.fillRect(-9, -20, 3, 26);

    ctx.strokeStyle = "#2a1a38";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4, -20); ctx.lineTo(2, 4);
    ctx.moveTo(6, -20); ctx.lineTo(0, 4);
    ctx.stroke();

    ctx.fillStyle = skin;
    rr(ctx, -9, -48, 18, 20, 7);
    ctx.fillStyle = "#0b0814";
    rr(ctx, -11, -52, 22, 14, 6);
    ctx.fillStyle = wpn.color;
    ctx.globalAlpha = 0.9;
    rr(ctx, 2, -46, 11, 7, 2);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = suit;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(4, -18);
    ctx.lineTo(4, -40);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(4, -36);
    ctx.lineTo(4, -48);
    ctx.stroke();

    var handX = 4, handY = -48;
    var gspr = SPRITES[wpn.id] || SPRITES[wpn.hold];
    var gw = gunLen, gh = gunLen * 0.28;
    ctx.save();
    ctx.translate(handX, handY);
    if (gspr && gspr.complete && (gspr.naturalWidth || 0) > 0) {
      gh = gunLen * (gspr.naturalHeight / gspr.naturalWidth);
      ctx.drawImage(gspr, -gripX * gw, -gripY * gh, gw, gh);
    } else {
      ctx.fillStyle = wpn.color;
      rr(ctx, 0, -5, gw * 0.85, 8, 2);
    }
    ctx.fillStyle = "#2a2a30";
    rr(ctx, gw * 0.55, 6, 3, 10, 1);
    rr(ctx, gw * 0.62, 6, 3, 10, 1);
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  console.log("[DeadSignal] v31 patch applied");
})();
