// DeadSignal boot v30 — load engine as plain JS string parts
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
  function loadParts(i, done) {
    if (i >= 4) return done();
    loadScript("js/epart" + i + ".js?v=" + v, function (err) {
      if (err) return done(err);
      loadParts(i + 1, done);
    });
  }
  loadScript("js/guns.js?v=" + v, function () {
    loadParts(0, function (err) {
      if (err || !(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
        showBootError("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
        console.error("[DeadSignal] engine missing after parts");
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
