// DeadSignal boot v29 — load plain engine parts (no gzip)
(function () {
  var v = "20260823v29";
  var parts = 4;
  var buf = "";
  var idx = 0;
  function loadText(src, cb) {
    var x = new XMLHttpRequest();
    x.open("GET", src);
    x.onload = function () {
      if (x.status === 200) cb(null, x.responseText);
      else cb(new Error("HTTP " + x.status));
    };
    x.onerror = function () { cb(new Error("net")); };
    x.send();
  }
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  function afterEngine() {
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v29");
        });
      });
    });
  }
  function next() {
    if (idx >= parts) {
      try {
        (0, eval)(buf);
        console.log("[DeadSignal] engine loaded", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
        afterEngine();
      } catch (err) {
        console.error("[DeadSignal] eval failed", err);
      }
      return;
    }
    loadText("js/engine.part" + idx + ".js?v=" + v, function (err, t) {
      if (err) { console.error(err); return; }
      buf += t;
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
