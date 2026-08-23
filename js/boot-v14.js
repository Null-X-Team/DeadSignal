// DeadSignal boot v19b — assemble engine.p1+p2 + guns (reliable start)
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
  var v = "20260822v19b";
  loadScript("js/guns.js?v=" + v, function () {
    loadText("js/engine.p1.js?v=" + v, function (e1, a) {
      if (e1) { console.error(e1); return; }
      loadText("js/engine.p2.js?v=" + v, function (e2, b) {
        if (e2) { console.error(e2); return; }
        try {
          (0, eval)(a + b);
          console.log("[DeadSignal] engine v19 assembled", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
        } catch (err) {
          console.error("[DeadSignal] eval failed", err);
          return;
        }
        loadScript("js/ui.js?v=" + v, function () {
          loadScript("js/gore.js?v=" + v, function () {
            console.log("[DeadSignal] ready v19");
            if (window.__dsBoot) window.__dsBoot();
          });
        });
      });
    });
  });
})();
