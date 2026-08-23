// DeadSignal v23 runtime patches: weapon swap by slot + safe weapon() + no double-flip
(function () {
  function apply() {
    var Eng = window.DeadSignalGame && window.DeadSignalGame.Engine;
    if (!Eng || !Eng.prototype) {
      setTimeout(apply, 50);
      return;
    }
    var proto = Eng.prototype;

    // Switch by slot number (1-0). Cycle if multiple owned share the slot.
    proto.switchWeapon = function (i) {
      var slot = i === 9 ? "0" : String(i + 1);
      this.switchSlot(slot);
    };
    proto.switchSlot = function (slot) {
      var owned = this.weapons.filter(function (w) {
        return w.owned && String(w.slot) === String(slot);
      });
      if (!owned.length) return;
      var cur = this.weapon();
      var next = owned[0];
      if (cur && String(cur.slot) === String(slot) && owned.length > 1) {
        var idx = owned.findIndex(function (w) { return w.id === cur.id; });
        next = owned[(Math.max(0, idx) + 1) % owned.length];
      }
      var ni = this.weapons.findIndex(function (w) { return w.id === next.id; });
      if (ni < 0) return;
      if (ni === this.weaponIndex && owned.length === 1) return;
      this.player.reload = 0;
      this.weaponIndex = ni;
      this.say(next.name.toUpperCase(), 0.65);
    };

    // Never return undefined weapon — always an owned gun (or first entry)
    proto.weapon = function () {
      var w = this.weapons[this.weaponIndex];
      if (w && w.owned) return w;
      for (var i = 0; i < this.weapons.length; i++) {
        if (this.weapons[i].owned) {
          this.weaponIndex = i;
          return this.weapons[i];
        }
      }
      this.weaponIndex = 0;
      return this.weapons[0];
    };

    // After buy, force equip so swap always works even if image missing
    var _buy = proto.buy;
    proto.buy = function (item) {
      var note = _buy.call(this, item);
      if (item && item.kind === "gun" && item.weaponId) {
        var ni = this.weapons.findIndex(function (x) { return x.id === item.weaponId; });
        if (ni >= 0 && this.weapons[ni].owned) {
          this.weaponIndex = ni;
          this.player.reload = 0;
        }
      }
      return note;
    };

    // NOTE: Do NOT hook Canvas drawImage. Engine already flips via DS_GUN_FLIP.
    // A global hook was double-flipping the Glock (and any shared Image objects).

    console.log("[DeadSignal] patch-v23 applied");
  }
  apply();
})();
