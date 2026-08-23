// DeadSignal boot v21 — assemble engine from e21_*.js
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
  function afterEngine() {
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        console.log("[DeadSignal] ready v21");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  }
  var v = "20260822v21";
  var eParts = 8;
  var eBuf = "";
  var eIdx = 0;
  function nextE() {
    if (eIdx >= eParts) {
      try {
        (0, eval)(eBuf);
        console.log("[DeadSignal] engine v21 assembled", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
        afterEngine();
      } catch (err) {
        console.error("[DeadSignal] assemble failed", err);
      }
      return;
    }
    loadText("js/e21_" + eIdx + ".js?v=" + v, function (err, t) {
      if (err) { console.error(err); return; }
      eBuf += t;
      eIdx++;
      nextE();
    });
  }
  loadScript("js/guns.js?v=" + v, nextE);
})();
