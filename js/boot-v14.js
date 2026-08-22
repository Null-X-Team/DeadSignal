// DeadSignal boot v15 - load engine.js then ui + gore
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("script fail", src); };
    document.head.appendChild(s);
  }
  loadScript("js/engine.js", function () {
    console.log("[DeadSignal] engine v15 loaded");
    loadScript("js/ui.js", function () {
      loadScript("js/gore.js", function () {
        console.log("[DeadSignal] ui+gore ready");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
