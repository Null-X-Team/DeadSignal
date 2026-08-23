// DeadSignal v22 runtime patches: weapon swap by slot + gun flip + safe fallback art
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

    // Never return undefined weapon
    proto.weapon = function () {
      var w = this.weapons[this.weaponIndex];
      if (w) return w;
      for (var i = 0; i < this.weapons.length; i++) {
        if (this.weapons[i].owned) {
          this.weaponIndex = i;
          return this.weapons[i];
        }
      }
      return this.weapons[0];
    };

    // Flip gun art that faces left (Glock etc.) when drawing
    if (!window.__dsFlipHook) {
      window.__dsFlipHook = true;
      var _di = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function () {
        var img = arguments[0];
        var should = false;
        if (img && window.DS_GUNS) {
          var g = window.DS_GUNS;
          if (img === g.pistol || img === g.smg || img === g.rail || img === g.burst || img === g.nailer || img === g.plasma) should = true;
        }
        if (should && arguments.length === 5) {
          var sx = arguments[1], sy = arguments[2], sw = arguments[3], sh = arguments[4];
          this.save();
          this.translate(sx + sw, sy);
          this.scale(-1, 1);
          _di.call(this, img, 0, 0, sw, sh);
          this.restore();
          return;
        }
        return _di.apply(this, arguments);
      };
    }
    console.log("[DeadSignal] patch-v22 applied");
  }
  apply();
})();
