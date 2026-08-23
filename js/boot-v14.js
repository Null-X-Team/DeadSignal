// DeadSignal boot v30e — load engine.js directly (stable)
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
  loadScript("js/guns.js?v=" + v, function () {
    loadScript("js/engine.js?v=" + v, function () {
      console.log("[DeadSignal] engine loaded", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
      afterEngine();
    });
  });
})();
