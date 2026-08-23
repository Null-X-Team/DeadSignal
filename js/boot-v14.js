// DeadSignal boot v30e — load engine from epack parts
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  function showBootError(msg) {
    try {
      var m = document.getElementById("menu");
      if (!m) return;
      var card = m.querySelector(".menu-card") || m;
      var p = document.createElement("p");
      p.style.color = "#ff6a5a";
      p.style.marginTop = "12px";
      p.textContent = msg;
      card.appendChild(p);
      var sb = document.getElementById("start-btn");
      if (sb) sb.onclick = function () { location.reload(); };
    } catch (e) {}
  }
  var v = "20260823v30e";
  var parts = 4;
  var idx = 0;
  function afterEngine() {
    if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
      showBootError("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
      return;
    }
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v30e");
        });
      });
    });
  }
  function next() {
    if (idx >= parts) {
      try {
        var code = (window.__DS_EP || []).join("");
        (0, eval)(code);
        console.log("[DeadSignal] engine assembled", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
        afterEngine();
      } catch (err) {
        console.error("[DeadSignal] eval failed", err);
        showBootError("Engine eval failed. Hard-refresh.");
      }
      return;
    }
    loadScript("js/epack_" + idx + ".js?v=" + v, function () {
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
