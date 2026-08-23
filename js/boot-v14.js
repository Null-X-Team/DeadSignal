// DeadSignal boot v30f2 — assemble engine from eng_0..2 (plain JS string chunks)
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
  var parts = 3;
  var idx = 0;
  function afterEngine() {
    if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
      showErr("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
      return;
    }
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v30f2");
        });
      });
    });
  }
  function next() {
    if (idx >= parts) {
      try {
        var arr = window.__DS_E || [];
        var code = "";
        for (var i = 0; i < arr.length; i++) code += arr[i] || "";
        (0, eval)(code);
        console.log("[DeadSignal] engine assembled", !!(window.DeadSignalGame && window.DeadSignalGame.Engine), code.length);
        afterEngine();
      } catch (err) {
        console.error("[DeadSignal] eval failed", err);
        showErr("Engine eval failed. Hard-refresh (Ctrl+Shift+R).");
      }
      return;
    }
    loadScript("js/eng_" + idx + ".js?v=" + v, function () {
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
