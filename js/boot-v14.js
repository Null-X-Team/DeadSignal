// DeadSignal boot v30f — assemble engine from epj_0..19
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
  var v = "20260823v30f";
  var parts = 20;
  var idx = 0;
  function afterEngine() {
    if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
      showErr("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
      return;
    }
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v30f");
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
        showErr("Engine eval failed. Hard-refresh (Ctrl+Shift+R).");
      }
      return;
    }
    loadScript("js/epj_" + idx + ".js?v=" + v, function () {
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
