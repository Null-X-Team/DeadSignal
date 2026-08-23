// DeadSignal boot v20 — assemble e20_0..e20_3 + guns
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  function loadText(src, cb) {
    var x = new XMLHttpRequest();
    x.open("GET", src);
    x.onload = function () {
      if (x.status === 200) cb(null, x.responseText);
      else cb(new Error("HTTP " + x.status + " " + src));
    };
    x.onerror = function () { cb(new Error("net " + src)); };
    x.send();
  }
  var v = "20260822v20";
  var parts = 4;
  var buf = "";
  var idx = 0;
  function next() {
    if (idx >= parts) {
      try {
        (0, eval)(buf);
        console.log("[DeadSignal] engine v20 assembled", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
      } catch (err) {
        console.error("[DeadSignal] eval failed", err);
        return;
      }
      loadScript("js/ui.js?v=" + v, function () {
        loadScript("js/gore.js?v=" + v, function () {
          console.log("[DeadSignal] ready v20");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
      return;
    }
    loadText("js/e20_" + idx + ".js?v=" + v, function (err, t) {
      if (err) { console.error(err); return; }
      buf += t;
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
