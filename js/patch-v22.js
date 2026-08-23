// DeadSignal v24 runtime patches (safety net — engine already has loadout/Q/E/Space)
(function () {
  function apply() {
    var Eng = window.DeadSignalGame && window.DeadSignalGame.Engine;
    if (!Eng || !Eng.prototype) {
      setTimeout(apply, 50);
      return;
    }
    var proto = Eng.prototype;

    // Ensure loadout exists on older sessions
    if (!proto.cycleLoadout) {
      proto.cycleLoadout = function () {
        if (!this.loadout) {
          this.loadout = ["pistol", null, null];
          this.loadoutIndex = 0;
        }
        var filled = [];
        for (var i = 0; i < this.loadout.length; i++) {
          if (this.loadout[i]) filled.push(i);
        }
        if (filled.length < 2) return;
        var cur = filled.indexOf(this.loadoutIndex);
        var next = filled[(Math.max(0, cur) + 1) % filled.length];
        this.loadoutIndex = next;
        this.player.reload = 0;
        var w = this.weapon();
        this.say(w.name.toUpperCase(), 0.55);
      };
    }
    if (!proto.swingHatchet) {
      proto.swingHatchet = function () {
        if (this.pulseKick) this.pulseKick();
      };
    }
    if (!proto.legKick) {
      proto.legKick = function () {
        if (this.pulseKick) this.pulseKick();
      };
    }
    if (!proto.equipToSlot) {
      proto.equipToSlot = function (slotIdx, weaponId) {
        return "Update required — hard refresh.";
      };
    }

    console.log("[DeadSignal] patch-v24 applied");
  }
  apply();
})();
