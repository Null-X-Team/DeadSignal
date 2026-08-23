// DeadSignal hatchet + crouch overlay (v19d)
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) {
    console.warn("[DeadSignal] hatchet overlay: engine missing");
    return;
  }
  var Proto = G.Engine.prototype;
  var _bind = Proto.bind;
  var _update = Proto.update;

  // Space = hatchet melee (42 dmg, directional)
  Proto.pulseKick = function () {
    if (this.phase !== "combat" || this.player.kick > 0 || this.shopOpen) return;
    this.player.kick = 1.35;
    this.trauma = Math.min(1, this.trauma + 0.55);
    this.burst(this.player.x + this.player.facing * 40, this.player.y - 10, "#c45c3a", 18, 200);
    this.say("HATCHET", 0.35);
    var reach = 95;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var dx = e.x - this.player.x;
      var dy = e.y - this.player.y;
      var d = Math.hypot(dx, dy);
      if (d < reach && Math.sign(dx || this.player.facing) === this.player.facing) {
        var f = (reach - d) / reach;
        e.vx += this.player.facing * 520 * f;
        e.knock = 0.35;
        e.hp -= 42;
        e.hit = 0.2;
        this.burst(e.x, e.y, "#e35d6a", 10, 140);
        if (e.hp <= 0) this.kill(e);
      }
    }
  };

  // Crouch via Ctrl/C
  Proto.update = function (dt) {
    if (this.player && this.keys) {
      this.player.crouch =
        this.keys.has("ControlLeft") ||
        this.keys.has("ControlRight") ||
        this.keys.has("KeyC");
    }
    return _update.call(this, dt);
  };

  // preventDefault for Ctrl/C/Space
  Proto.bind = function () {
    _bind.call(this);
    window.addEventListener(
      "keydown",
      function (e) {
        if (
          e.code === "ControlLeft" ||
          e.code === "ControlRight" ||
          e.code === "KeyC" ||
          e.code === "Space"
        ) {
          e.preventDefault();
        }
      },
      true
    );
  };

  console.log("[DeadSignal] hatchet+crouch overlay ready");
})();
