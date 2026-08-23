// DeadSignal boot v20 — assemble engine.p1+p2 + guns
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
  loadScript("js/guns.js?v=" + v, function () {
    loadText("js/engine.p1.js?v=" + v, function (e1, a) {
      if (e1) return console.error(e1);
      loadText("js/engine.p2.js?v=" + v, function (e2, b) {
        if (e2) return console.error(e2);
        try {
          (0, eval)(a + b);
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
      });
    });
  });
})();
