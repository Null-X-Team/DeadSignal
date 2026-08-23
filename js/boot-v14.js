// DeadSignal boot v30 — plain script load (no gzip chunks)
(function () {
  var v = "20260823v30";
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(null); };
    s.onerror = function () {
      console.error("[DeadSignal] fail", src);
      cb && cb(new Error("fail " + src));
    };
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
    } catch (e) {}
  }
  loadScript("js/guns.js?v=" + v, function () {
    loadScript("js/engine-full.js?v=" + v, function (err) {
      if (err || !(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
        showBootError("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
        console.error("[DeadSignal] engine missing after load");
        return;
      }
      console.log("[DeadSignal] engine ready");
      loadScript("js/ui.js?v=" + v, function () {
        loadScript("js/gore.js?v=" + v, function () {
          loadScript("js/patch-v22.js?v=" + v, function () {
            console.log("[DeadSignal] ready v30");
          });
        });
      });
    });
  });
})();
