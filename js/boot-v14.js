// DeadSignal boot v19d — load known-good engine + hatchet overlay
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  var v = "20260822v19d";
  // known-good engine (startRun + pulseKick) via jsDelivr CDN
  var engineSrc =
    "https://cdn.jsdelivr.net/gh/Null-X-Team/DeadSignal@7b42a50c3017e8cd8dab0df72cff7b0895efd0a4/js/engine.js";
  loadScript("js/guns.js?v=" + v, function () {
    loadScript(engineSrc, function () {
      console.log("[DeadSignal] engine loaded", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
      loadScript("js/hatchet.js?v=" + v, function () {
        loadScript("js/ui.js?v=" + v, function () {
          loadScript("js/gore.js?v=" + v, function () {
            console.log("[DeadSignal] ready v19d");
            if (window.__dsBoot) window.__dsBoot();
          });
        });
      });
    });
  });
})();
