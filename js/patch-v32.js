// DeadSignal v32 — account score hooks
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var _die = proto.die;
  proto.die = function () {
    _die.call(this);
    try {
      if (window.DeadSignalAuth) window.DeadSignalAuth.recordRun(this.wave || 0, this.score || 0);
    } catch (e) {}
  };
  var _bi = proto.beginIntermission;
  if (_bi) {
    proto.beginIntermission = function () {
      _bi.call(this);
      try {
        if (window.DeadSignalAuth) window.DeadSignalAuth.recordRun(this.wave || 0, this.score || 0);
      } catch (e) {}
    };
  }
  console.log("[DeadSignal] v32 auth hooks");
})();
