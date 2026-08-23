// DeadSignal boot v18f - direct engine.js (crouch + guns)
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "" : ("?v=" + Date.now()));
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  function chain(list, i, done) {
    if (i >= list.length) return done && done();
    loadScript(list[i], function () { chain(list, i + 1, done); });
  }
  // guns first so DS_GUNS exists when engine evaluates
  loadScript("js/guns.js?v=20260822v18f", function () {
    loadScript("js/engine.js?v=20260822v18f", function () {
      console.log("[DeadSignal] engine v18f crouch+guns (direct)");
      chain(["js/ui.js?v=20260822v18f", "js/gore.js?v=20260822v18f"], 0, function () {
        console.log("[DeadSignal] ready v18f");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
