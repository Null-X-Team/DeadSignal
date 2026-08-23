// DeadSignal boot v19 — direct engine.js + guns (reliable start)
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  var v = "20260822v19b";
  loadScript("js/guns.js?v=" + v, function () {
    loadScript("js/engine.js?v=" + v, function () {
      console.log("[DeadSignal] engine v19 loaded", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
      loadScript("js/ui.js?v=" + v, function () {
        loadScript("js/gore.js?v=" + v, function () {
          console.log("[DeadSignal] ready v19");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
    });
  });
})();
