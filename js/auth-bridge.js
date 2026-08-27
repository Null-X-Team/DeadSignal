// DeadSignal v35 — bridge auth ↔ meta save (load before ready)
(function () {
  function wrap() {
    var Auth = window.DeadSignalAuth;
    var Meta = window.DeadSignalMeta;
    if (!Auth || !Meta || Auth.__metaBridged) return;
    Auth.__metaBridged = true;

    function afterAuth(res) {
      if (!res || !res.ok) return res;
      var s = Auth.getSession && Auth.getSession();
      if (s && s.cloud && s.uid) {
        return Meta.loadFromCloud().then(function () { return res; });
      }
      Meta.markEmptyGuest();
      return res;
    }

    var _reg = Auth.register.bind(Auth);
    Auth.register = function (u, p) {
      return Promise.resolve(_reg(u, p)).then(afterAuth);
    };
    var _login = Auth.login.bind(Auth);
    Auth.login = function (u, p) {
      return Promise.resolve(_login(u, p)).then(afterAuth);
    };
    var _guest = Auth.guest.bind(Auth);
    Auth.guest = function () {
      return Promise.resolve(_guest()).then(function (res) {
        Meta.markEmptyGuest();
        return res;
      });
    };
    var _gate = Auth.gate.bind(Auth);
    Auth.gate = function () {
      _gate();
      var s = Auth.getSession && Auth.getSession();
      if (s && s.cloud && s.uid) Meta.loadFromCloud();
      else if (s) Meta.markEmptyGuest();
    };
    var _refresh = Auth.refreshChip.bind(Auth);
    Auth.refreshChip = function () {
      _refresh();
      if (Meta.refreshChip) Meta.refreshChip();
    };
    console.log("[DeadSignal] auth-bridge ready");
  }
  if (window.DeadSignalAuth && window.DeadSignalMeta) wrap();
  else setTimeout(wrap, 0);
})();
