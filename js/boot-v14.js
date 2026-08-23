// DeadSignal boot v18 - classic characters, direct engine.js + guns
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
  // guns.js (optional DS_GUNS) -> engine.js -> ui + gore
  loadScript("js/guns.js?v=20260822v18b", function () {
    loadScript("js/engine.js?v=20260822v18b", function () {
      console.log("[DeadSignal] engine v18 classic");
      chain(["js/ui.js?v=20260822v18b", "js/gore.js?v=20260822v18b"], 0, function () {
        console.log("[DeadSignal] ready v18");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
