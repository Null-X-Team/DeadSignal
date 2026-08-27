// DeadSignal v35 — skills, coins, cloud save hooks
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var Meta = function () { return window.DeadSignalMeta; };

  var _bind = proto.bind;
  proto.bind = function () {
    _bind.call(this);
    window.__deadSignal = this;
  };

  var _start = proto.startRun;
  proto.startRun = function () {
    _start.call(this);
    var M = Meta();
    if (!M) return;
    M.getState().secondWindUsed = false;
    var bonusHp = M.maxHpBonus();
    this.player.max = 100 + bonusHp;
    this.player.hp = this.player.max;
    this.credits = (this.credits | 0) + M.startCredits();
    this.pushHud && this.pushHud();
  };

  var _bi = proto.beginIntermission;
  proto.beginIntermission = function () {
    _bi.call(this);
    var M = Meta();
    if (!M) return;
    var heal = M.waveHeal();
    if (heal > 0 && this.player) {
      this.player.hp = Math.min(this.player.max, this.player.hp + heal);
    }
    M.onWaveCleared(this.wave | 0);
  };

  var _die = proto.die;
  proto.die = function () {
    var M = Meta();
    if (M && M.hasSecondWind() && !M.getState().secondWindUsed && this.player) {
      M.getState().secondWindUsed = true;
      this.player.hp = 1;
      this.phase = "combat";
      this.say("SECOND WIND", 1.2);
      this.pushHud && this.pushHud();
      return;
    }
    _die.call(this);
    if (M && M.isReady()) M.saveToCloud(true);
  };

  var _kill = proto.kill;
  proto.kill = function (e) {
    var M = Meta();
    var mul = M ? M.creditMul() : 1;
    var sc = e.score || 0;
    if (mul !== 1) e.score = Math.round(sc * mul);
    _kill.call(this, e);
    if (mul !== 1) e.score = sc;
  };

  var _fire = proto.fire;
  if (_fire) {
    proto.fire = function () {
      var before = this.bullets ? this.bullets.length : 0;
      _fire.call(this);
      var M = Meta();
      if (!M) return;
      var dmgMul = M.dmgMul();
      var arm = M.armorIgnore();
      var rof = M.rofMul();
      if (this.bullets) {
        for (var i = before; i < this.bullets.length; i++) {
          var b = this.bullets[i];
          b.damage = Math.round((b.damage || 0) * dmgMul);
          if (arm > 0) b._armorIgnore = arm;
        }
      }
      if (this.player && this.player.fire > 0 && rof < 1) this.player.fire *= rof;
    };
  }

  var _update = proto.update;
  proto.update = function (dt) {
    var M = Meta();
    var spd = M ? M.moveMul() : 1;
    if (spd !== 1 && this.player && (this.phase === "combat" || this.phase === "intermission")) {
      var x0 = this.player.x;
      _update.call(this, dt);
      if (this.player && this.player.x !== x0) {
        var dx = this.player.x - x0;
        this.player.x = x0 + dx * spd;
      }
      return;
    }
    _update.call(this, dt);
  };

  var _swing = proto.swingHatchet;
  if (_swing) {
    proto.swingHatchet = function () {
      var M = Meta();
      if (!M) return _swing.call(this);
      var mul = M.meleeMul();
      var extra = M.meleeReach();
      var enemies = this.enemies;
      var before = enemies.map(function (e) { return e.hp; });
      _swing.call(this);
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.dead) continue;
        var lost = before[i] - e.hp;
        if (lost > 0 && mul !== 1) {
          e.hp -= Math.round(lost * (mul - 1));
          if (e.hp <= 0) this.kill(e);
        }
      }
      if (extra > 0 && this.player.kick > 0) {
        var facing = this.player.facing;
        var reach = 92 + extra;
        var boxL = Math.min(this.player.x, this.player.x + facing * reach) - 6;
        var boxR = Math.max(this.player.x, this.player.x + facing * reach) + 6;
        for (var j = 0; j < this.enemies.length; j++) {
          var en = this.enemies[j];
          if (en.dead) continue;
          if (en.x + en.r * 0.55 >= boxL && en.x - en.r * 0.55 <= boxR) {
            if (Math.sign((en.x - this.player.x) || facing) !== facing) continue;
            if (Math.abs(en.x - this.player.x) <= 92) continue;
            var hd = Math.round(42 * mul);
            if ((en.armor || 0) > 0) hd = Math.max(8, hd - Math.floor(en.armor * 0.55));
            en.hp -= hd;
            en.hit = 0.18;
            this.bloodHit(en.x, en.y - 8);
            if (en.hp <= 0) this.kill(en);
          }
        }
      }
    };
  }

  var _reload = proto.beginReload;
  if (_reload) {
    proto.beginReload = function () {
      _reload.call(this);
      var M = Meta();
      if (!M || !this.player) return;
      var mul = M.reloadMul();
      if (mul < 1 && this.player.reload > 0) this.player.reload *= mul;
    };
  }

  console.log("[DeadSignal] v35 meta hooks");
})();
