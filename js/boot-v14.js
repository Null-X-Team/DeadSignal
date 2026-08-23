// DeadSignal boot v26 — load engine.js directly
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  var v = "20260823v26";
  function afterEngine() {
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v26");
        });
      });
    });
  }
  loadScript("js/guns.js?v=" + v, function () {
    loadScript("js/engine.js?v=" + v, function () {
      console.log("[DeadSignal] engine loaded", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
      afterEngine();
    });
  });
})();
