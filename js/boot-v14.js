// DeadSignal boot v30f — load full engine.js directly (no chunk assemble)
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () {
      console.error("[DeadSignal] fail", src);
      showErr("Failed to load " + src + ". Hard-refresh (Ctrl+Shift+R).");
      cb && cb();
    };
    document.head.appendChild(s);
  }
  function showErr(msg) {
    try {
      var m = document.getElementById("menu");
      if (!m) return;
      var p = document.createElement("p");
      p.style.color = "#ff6a5a";
      p.style.marginTop = "12px";
      p.textContent = msg;
      (m.querySelector(".menu-card") || m).appendChild(p);
    } catch (e) {}
  }
  var v = "20260823v30f2";
  loadScript("js/guns.js?v=" + v, function () {
    loadScript("js/engine.js?v=" + v, function () {
      if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
        showErr("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
        return;
      }
      console.log("[DeadSignal] engine ready v30f2");
      loadScript("js/ui.js?v=" + v, function () {
        loadScript("js/gore.js?v=" + v, function () {
          loadScript("js/patch-v22.js?v=" + v, function () {
            console.log("[DeadSignal] ready v30f2");
          });
        });
      });
    });
  });
})();
